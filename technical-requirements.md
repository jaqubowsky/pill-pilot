# PillPilot - Technical Requirements

Related documents:
- `PRD_PillPilot.md` — product requirements, user stories
- `design.md` — design system, components, screen wireframes
- `tech-stack.md` — stack, conventions, folder structure
- `ROADMAP.md` — implementation checklist

---

## Data Model

### User (Better Auth managed)
```
id: string (cuid)
email: string (unique)
name: string (nullable)
emailVerified: boolean (default: false)
image: string (nullable)
settings: json (nullable) - reserved for future use
createdAt: timestamp
updatedAt: timestamp
```

Better Auth also manages `sessions`, `accounts`, and `verifications` tables (see Better Auth docs).

### Supplement (= user's inventory item, per user)
```
id: string (cuid)
userId: string (FK -> User)
name: string - e.g. "NAC"
brandName: string (nullable) - e.g. "Apollo's Hegemony"
category: enum (medication, supplement, vitamin, mineral, probiotic, herb, amino_acid, other) - default: supplement
stockUnit: dosageUnit enum (capsule, tablet, ml, drops, g, mg, scoop, sachet, spray, portion) - default: capsule
    Source of truth for units. Changing stockUnit via supplement edit cascades to all schedule dosageUnit values.
currentStock: decimal(10,2) (nullable) - null = tracking off
stockWarningThreshold: integer (nullable)
packageSize: integer (nullable) - how many units per package
packagePrice: decimal(10,2) (nullable) - package price (without currency)
active: boolean (default: true)
createdAt: timestamp
```

### TimeBlock (= time block, per user, configurable)
```
id: string (cuid)
userId: string (FK -> User)
name: string - e.g. "Na czczo", "Sniadanie"
icon: string - Lucide icon name, e.g. "Sunrise", "Coffee"
startTime: string (HH:mm) - e.g. "06:30"
sortOrder: integer
active: boolean (default: true)
createdAt: timestamp
```

No `endTime` — a block lasts until the `startTime` of the next block (by sortOrder). The last block lasts until the `startTime` of the first one (wraps past midnight).

Default blocks created on registration (via Better Auth `databaseHooks.user.create.after`):

| name | icon | startTime | sortOrder |
|------|------|-----------|-----------|
| Na czczo | Sunrise | 06:30 | 0 |
| Sniadanie | Coffee | 08:00 | 1 |
| 2. sniadanie | Apple | 10:30 | 2 |
| Przed obiadem | Clock | 12:30 | 3 |
| Obiad | Sun | 13:00 | 4 |
| Przed kolacja | Clock | 18:30 | 5 |
| Kolacja | Sunset | 19:00 | 6 |
| Po kolacji | UtensilsCrossed | 19:30 | 7 |
| Przed snem | Moon | 22:00 | 8 |

User can: add new blocks, edit name/icon/start time, reorder, delete (soft delete).

### Protocol
```
id: string (cuid)
userId: string (FK -> User)
name: string
parsedData: text (nullable) - AI parsed output (JSON), used in preview for editing before confirmation
status: enum (draft, active, archived, processing, failed)
startDate: date (nullable) - protocol start date, set on confirmation
createdAt: timestamp
```

### SupplementSchedule (= the core join table: Protocol <-> Supplement <-> TimeBlock)
```
id: string (cuid)
protocolId: string (FK -> Protocol, cascade delete)
supplementId: string (FK -> Supplement, cascade delete)
timeBlockId: string (FK -> TimeBlock, cascade delete)
dosageAmount: decimal(10,2) - not null
dosageUnit: enum (capsule, tablet, ml, drops, g, mg, scoop, sachet, spray, portion) - not null
notes: text (nullable) - e.g. "30 min przed jedzeniem", displayed on dashboard
isCritical: boolean (default: false) - per-schedule critical flag
cycleDaysOn: integer (nullable) - days on in cycle
cycleDaysOff: integer (nullable) - days off in cycle
startDayOffset: integer (default: 0) - day offset from protocol start when schedule becomes active
durationDays: integer (nullable) - how many days, null = indefinitely
dosageIntervalMinutes: integer (nullable) - minimum minutes between doses (antibiotics etc.)
waitAfterTakingMinutes: integer (nullable) - minutes to wait after taking before eating
sortOrder: integer (default: 0)
active: boolean (default: true)
createdAt: timestamp
```

There is NO `ProtocolSupplement` table — `SupplementSchedule` is the direct link between Protocol, Supplement, and TimeBlock. All per-schedule fields (notes, isCritical, cycling, timing, etc.) live on this table.

### DailyLog
```
id: string (cuid)
scheduleId: string (FK -> SupplementSchedule, cascade delete)
date: date
takenAt: timestamp (default: now)
timerNotifiedAt: timestamp (nullable) - when the wait-after-taking timer notification was sent/skipped
timerAdjustmentMinutes: integer (nullable) - manual adjustment to cooldown timer
cooldownSkippedAt: timestamp (nullable) - when user skipped the dosage interval cooldown
```

### PushSubscription
```
id: string (cuid)
userId: string (FK -> User, cascade delete)
subscriptionJson: text - Web Push subscription JSON
createdAt: timestamp
```

### NotificationSetting
```
id: string (cuid)
userId: string (FK -> User, cascade delete)
timeBlockId: string (FK -> TimeBlock, cascade delete)
enabled: boolean (default: true)
notifyAt: text - HH:mm time to send notification
lastSentDate: text (nullable) - date string of last sent notification
createdAt: timestamp
```

### Relations
```
User 1->N Supplement (my inventory)
User 1->N TimeBlock (time blocks)
User 1->N Protocol
User 1->N PushSubscription
Protocol 1->N SupplementSchedule
SupplementSchedule N->1 Supplement
SupplementSchedule N->1 TimeBlock
SupplementSchedule 1->N DailyLog
User+TimeBlock 1->1 NotificationSetting
```

### Constraints
- DailyLog: unique on (scheduleId, date) — prevents double checking off the same schedule on the same day
- All FKs to User, Protocol, Supplement, TimeBlock, SupplementSchedule use `onDelete: cascade`

---

## Multi-protocol aggregation

Dashboard collects schedules from ALL active protocols (protocol.status = active). Query `get-daily-status`:
- JOIN supplementSchedules + supplements + protocols + timeBlocks WHERE schedule.active = true AND protocol.status = active AND supplement.active = true AND timeBlock.active = true
- Groups by timeBlock, sorts by startTime
- Attaches Supplement info (name, category, stockUnit, currentStock), stock forecast (daysRemaining), and DailyLog per date
- Calculates cycling state, dependency/offset state, expiration, cooldown timers, and wait timers per entry
- Filters out entries where startDayOffset hasn't been reached yet (unless already logged)
- Assigns protocol colors for multi-protocol visual distinction

If user has Protocol A and Protocol B, both with NAC in the "Sniadanie" block — the dashboard shows two separate schedule entries, both linking to the same Supplement. Both decrement the same stock.

---

## Protocol archival

- `protocol.status -> archived`
- All related `supplementSchedules.active -> false`
- Archived protocol schedules disappear from dashboard and do not count toward dailyUsage
- Reactivation: `protocol.status -> active`, `supplementSchedules.active -> true`
- Archival does NOT delete data — historical DailyLog entries remain

---

## Protocol deletion

- Hard delete: `protocol` row deleted from database
- Cascade delete removes all related `supplementSchedules` and `dailyLogs`
- Used for draft/failed protocols; archived protocols use archival instead

---

## Protocol editing

- Existing protocol can be edited via `/protocol/edit/[id]`
- Update action (`update-protocol.ts`): deletes all existing schedules for the protocol, then recreates from updated parsed data
- Updates protocol name, parsedData, and startDate
- Redirects to `/settings` after completion

---

## Deleting a supplement

- Deleting a supplement (supplement.active -> false) cascades deactivation to all related supplementSchedules (schedule.active -> false)
- Deactivated schedules disappear from dashboard
- Soft delete — data remains but is not visible in UI
- Historical DailyLog entries remain intact

---

## Deleting / editing a time block

- Deletion (soft delete: `timeBlock.active -> false`) — blocked if there are active schedules assigned to this block (throws `HAS_ACTIVE_SCHEDULES`). User must first move schedules to another block or deactivate them.
- Editing name/icon/startTime — no restrictions, change propagates to dashboard
- Reordering (sortOrder) — supported via `timeBlockRepository.reorder()`

---

## Adding a new protocol

Flow for creating a new protocol:
1. Navigate to `/protocol/new`
2. Upload file -> triggers `POST /api/protocol/parse`
3. Protocol created with status `processing`, AI runs asynchronously via `after()`
4. When AI completes: protocol status -> `draft`, parsedData populated
5. If AI fails: protocol status -> `failed`
6. User reviews parsed preview at `/protocol/new/preview`
7. Confirmation -> creates SupplementSchedule entries, protocol status -> `active`, startDate set
8. Redirect to `/dashboard`

Alternative: manual protocol creation via `/protocol/new/manual`

Routing:
- `/protocol/new` — upload step
- `/protocol/new/preview` — AI-parsed protocol preview
- `/protocol/new/manual` — manual protocol form
- `/protocol/edit/[id]` — edit existing protocol
- All flows use actions: `create-draft-protocol.ts`, `save-draft-protocol.ts`, `delete-draft-protocol.ts`, `create-protocol.ts`, `update-protocol.ts`

---

## Stock logic

- Stock is on Supplement (one box). Schedule references the box from the shelf.
- `stockUnit` on Supplement is the source of truth for units. Dashboard dosage unit is read-only, derived from `stockUnit`.
- Decrement on check: `supplement.currentStock -= schedule.dosageAmount` (via SQL `GREATEST(0, currentStock - amount)`)
- **Block at zero: marking taken throws `OUT_OF_STOCK` error when `currentStock <= 0`.** Checking off at stock = 0 is blocked.
- `markBlockTaken` silently skips out-of-stock supplements (does not throw, just `continue`s)
- Undo check: `supplement.currentStock += schedule.dosageAmount`
- **Floor: stock does NOT go below 0.** Uses `GREATEST(0, ...)` in SQL.
- Replenish: `supplement.currentStock += amount`
- Correction (update): `supplement.currentStock = new_value`
- Stock forecast: `forecastDaysInStock()` in `shared/lib/stock-forecast.ts` simulates day-by-day consumption respecting cycling, startDayOffset, durationDays, and protocol startDate
- Stock calculator: `calculateRemainingStock` action estimates remaining stock based on package size and days since opening

## Cost logic

- Cost per unit: `packagePrice / packageSize`
- Daily cost: `cost_per_unit * dailyUsage`
- Monthly cost: `daily_cost * 30`
- We display just the number (without currency)
- Both fields (packagePrice, packageSize) must be filled in to calculate cost

---

## Dosage interval (cooldown) logic

For supplements with `dosageIntervalMinutes` set (e.g. antibiotics "co 6 godzin"):
- Before marking taken, `enforceCooldown()` checks if enough time has passed since the last dose of the same supplement in the same protocol on the same date
- If cooldown is active, throws `COOLDOWN_ACTIVE` error
- User can skip cooldown via `skipCooldown` action (sets `cooldownSkippedAt` on the most recent sibling log)
- Timer adjustment: `adjustTimer` action adds/subtracts minutes to the cooldown via `timerAdjustmentMinutes` on the DailyLog
- Cooldown calculation: `expiresAt = takenAt + intervalMs + adjustmentMs`

## Wait-after-taking timer logic

For supplements with `waitAfterTakingMinutes` set (e.g. "30 min przed jedzeniem"):
- After marking taken, a countdown timer is shown on the dashboard
- User can skip the wait timer via `skipWaitTimer` action (sets `timerNotifiedAt` on the DailyLog)
- When `markTaken` is called with `skipTimer: true`, `timerNotifiedAt` is set immediately to the current time

---

## Schedule editing from dashboard

`updateSchedule` action allows editing a schedule's supplement info and schedule-specific fields from the dashboard:
- Updates supplement: name, brandName, category
- Updates schedule: dosageAmount, dosageUnit, timeBlockId, notes, isCritical, cycling, startDayOffset, durationDays, dosageIntervalMinutes, waitAfterTakingMinutes
- `dosageIntervalMinutes` changes always propagate to sibling schedules (same protocol + supplement)
- For other shared fields (isCritical, notes, cycling, etc.), if siblings exist, returns the list of siblings and changed fields for user confirmation
- If `updateSiblings: true` with `changedFields`, syncs specified fields to all siblings

---

## Time Block — active block logic

Blocks are per-user, stored in the `timeBlocks` table (see Data Model). Active block on dashboard:

- Blocks sorted by `startTime`. Each block lasts from its `startTime` until the `startTime` of the next block
- Active = the block whose `startTime` is closest in the past (or equal to the current time)
- On dashboard, expanded by default: active block + first incomplete block
- If all blocks are complete -> all collapsed

---

## AI Parsing - Two-Step Flow

### Step 1: Raw Extraction

Extracts raw text data from the uploaded file.

**Supported file types:** PDF, Excel (.xlsx/.xls), DOCX, images (JPEG/PNG/WebP/GIF), plain text (.txt)

**Model:** `claude-haiku-4-5`

**Raw extraction schema:**
```typescript
{
  protocolName: string,
  items: [{
    name: string,
    rawDosage: string,
    rawTiming: string,
    rawNotes: string | null,
    rawCategory: string,
    rawCycling: string | null,
    rawDependency: string | null,
    rawInterval: string | null,
    rawWaitAfter: string | null,
    isMedication: boolean,
  }]
}
```

### Step 2: Enrichment

Matches raw extraction against user context, structures into protocol format.

**Model:** `claude-sonnet-4-5`

**AI Input — user context:**
```typescript
{
  supplements: [{ id, name }],        // existing inventory
  timeBlocks: [{ id, name }],         // user's time blocks
  activeProtocols: [{ name, supplements: string[] }],  // existing protocol context
}
```

Optional: `userInstructions` (string, max 1000 chars) — additional user guidance for parsing.

**AI Output Schema:**
```typescript
{
  protocolName: string,
  supplements: [{
    name: string,
    existingSupplementId: string | null,  // ID from context or null (new)
    brandName: string | null,
    category: SupplementCategory,
    isCritical: boolean,
    notes: string | null,                 // shared notes (schedule-level takes precedence)
    cycleDaysOn: number | null,           // shared cycling (schedule-level takes precedence)
    cycleDaysOff: number | null,
    startDayOffset: number,               // shared offset (schedule-level takes precedence)
    durationDays: number | null,          // shared duration (schedule-level takes precedence)
    dosageIntervalMinutes: number | null, // minimum minutes between doses
    waitAfterTakingMinutes: number | null,// shared wait (schedule-level takes precedence)
    confidence: number,                   // 0.0-1.0
    uncertaintyReason: string | null,     // Polish explanation when confidence < 0.9
    _removed: boolean | undefined,        // UI flag for removed supplements in preview
    schedules: [{
      dosageAmount: number,
      dosageUnit: DosageUnit,
      timeBlockId: string,
      notes: string | null,               // per-schedule notes override
      waitAfterTakingMinutes: number | null, // per-schedule wait override
      isCritical: boolean,                // per-schedule critical flag
      cycleDaysOn: number | null,         // per-schedule cycling override
      cycleDaysOff: number | null,
      startDayOffset: number,             // per-schedule offset override
      durationDays: number | null,        // per-schedule duration override
    }]
  }]
}
```

Per-schedule fields take precedence over supplement-level fields. When creating SupplementSchedule rows, the `create-protocol` action resolves: `schedule.field ?? supplement.field ?? default`.

### Confidence threshold

`CONFIDENCE_THRESHOLD = 0.9` — supplements below this threshold must have `uncertaintyReason` set and cannot be confirmed without user review.

### File handling

Uploaded file is ephemeral:
1. Frontend sends file + context to `POST /api/protocol/parse`
2. Protocol created with status `processing`
3. API route uses `after()` to run AI asynchronously:
   a. Step 1: Extract raw data (claude-haiku-4-5)
   b. Step 2: Enrich with user context (claude-sonnet-4-5)
4. On success: protocol status -> `draft`, parsedData populated
5. On failure (AI error or empty output): protocol status -> `failed`
6. File is NOT persisted — no file storage

### Rate limiting

In-memory rate limit: 5 requests per 60 seconds per user.

### Image handling

Images are compressed via `sharp` to fit within 4.5 MB limit. Resized to max 2048px, JPEG at 80% quality (50% if still too large).

### Excel handling

Excel files are parsed with `exceljs`. Cell background colors are extracted for phase detection (e.g. color-coded treatment phases). A color legend is built from row 2.

---

## Push Notifications

### API Routes

- `POST /api/push/subscribe` — register/unregister Web Push subscription
- `POST /api/push/send` — send test notification
- `GET /api/push/timers` — cron endpoint for sending scheduled time block notifications

### Architecture

Push subscriptions are stored in a separate `pushSubscriptions` table (not on User). Notification settings are per-user-per-timeBlock in `notificationSettings` table, controlling which time blocks trigger notifications and at what time.

---

## Server Actions

### Dashboard
- `markTaken` — check off a schedule, decrement stock, enforce cooldown
- `markUntaken` — undo check, increment stock
- `markBlockTaken` — batch check off all unchecked schedules in a time block (skips out-of-stock)
- `updateSchedule` — edit supplement info and schedule fields from dashboard
- `adjustTimer` — adjust cooldown timer by +/- minutes
- `skipWaitTimer` — skip the wait-after-taking countdown
- `skipCooldown` — skip the dosage interval cooldown

### Protocol Wizard
- `createDraftProtocol` — create a new draft protocol
- `saveDraftProtocol` — save/update draft protocol parsed data
- `deleteDraftProtocol` — delete a draft protocol
- `createProtocol` — confirm and activate a protocol with all schedules

### Settings
- `archiveProtocol` — archive protocol, deactivate all schedules
- `reactivateProtocol` — reactivate archived protocol and schedules
- `deleteProtocol` — hard delete a protocol (cascade)
- `updateProtocol` — edit existing protocol (delete+recreate schedules)
- `addTimeBlock` — create a new time block
- `updateTimeBlock` — edit time block name/icon/startTime
- `deleteTimeBlock` — soft delete time block (blocked if active schedules)

### Stock
- `replenishStock` — add units to current stock
- `updateStock` — set stock to exact value
- `calculateRemainingStock` — estimate remaining stock from package size and consumption

### Supplements
- `addSupplement` — create a new supplement
- `updateSupplement` — edit supplement details
- `deleteSupplement` — soft delete supplement, deactivate related schedules

### Notifications
- `updateNotificationSettings` — upsert notification settings per time block
- `sendTestNotification` — send a test push notification
