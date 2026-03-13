# PillPilot - Technical Requirements

Related documents:
- `PRD_PillPilot.md` — product requirements, user stories
- `design.md` — design system, components, screen wireframes
- `tech-stack.md` — stack, conventions, folder structure
- `ROADMAP.md` — implementation checklist

---

## Data Model

### User
```
id: string (cuid)
email: string
name: string (nullable)
onboardingStep: enum (upload, preview, complete) — WEEK 1 will add stock_setup between preview and complete
createdAt: timestamp
pushSubscription: json (nullable)          # [WEEK 1]
settings: json (nullable) - reserved for future use
```

### Supplement (= user's inventory item, per user)
```
id: string (cuid)
userId: string (FK -> User)
name: string - e.g. "NAC"
brandName: string (nullable) - e.g. "Apollo's Hegemony"
category: enum (medication, supplement, vitamin, mineral, probiotic, herb, amino_acid, other)
isCritical: boolean
currentStock: decimal (nullable) - null = tracking off (decimal because it supports fractional units: ml, g, drops)
stockWarningThreshold: integer (nullable)              # [WEEK 1]
packageSize: integer (nullable)                        # how many units per package
packagePrice: decimal (nullable)                       # package price (without currency)
active: boolean (default: true)
createdAt: timestamp
```

### TimeBlock (= time block, per user, configurable)
```
id: string (cuid)
userId: string (FK -> User)
name: string - e.g. "Na czczo", "Śniadanie"
icon: string - Lucide icon name, e.g. "Sunrise", "Coffee"
startTime: string (HH:mm) - e.g. "06:30"
sortOrder: integer
active: boolean (default: true)
createdAt: timestamp
```

No `endTime` — a block lasts until the `startTime` of the next block (by sortOrder). The last block lasts until the `startTime` of the first one (wraps past midnight).

Default blocks created on registration:

| name | icon | startTime | sortOrder |
|------|------|-----------|-----------|
| Na czczo | Sunrise | 06:30 | 0 |
| Śniadanie | Coffee | 08:00 | 1 |
| Obiad | Sun | 13:00 | 2 |
| Kolacja | Sunset | 19:00 | 3 |
| Przed snem | Moon | 22:00 | 4 |

User can: add new blocks, edit name/icon/start time, reorder, delete (soft delete).

### Protocol
```
id: string (cuid)
userId: string (FK -> User)
name: string
parsedData: text - AI parsed output (JSON), used in preview for editing before confirmation
status: enum (draft, active, archived)
createdAt: timestamp
```

### ProtocolSupplement (= link between protocol and supplement, per protocol)
```
id: string (cuid)
protocolId: string (FK -> Protocol)
supplementId: string (FK -> Supplement)
notes: string (nullable) - e.g. "30 min before meal", displayed on dashboard
cycleStartDate: date (nullable) - start date for cycling
cycleDaysOn: integer (nullable) - days on in cycle
cycleDaysOff: integer (nullable) - days off in cycle
sortOrder: integer (default: 0)
active: boolean (default: true)
unique: (protocolId, supplementId)
```

### SupplementSchedule (= when and how much, per protocol supplement)
```
id: string (cuid)
protocolSupplementId: string (FK -> ProtocolSupplement)
timeBlockId: string (FK -> TimeBlock)
dosageAmount: decimal
dosageUnit: enum (capsule, tablet, ml, drops, g, mg, scoop, sachet, spray, portion)
```

### DailyLog
```
id: string (cuid)
scheduleId: string (FK -> SupplementSchedule)
date: date
takenAt: timestamp - moment of checking off (in MVP always set; nullable planned for V2 skip)
skipReason: enum (nullable)                # [V2]
```

### Relations
```
User 1->N Supplement (my inventory)
User 1->N TimeBlock (time blocks)
User 1->N Protocol
Protocol 1->N ProtocolSupplement
ProtocolSupplement N->1 Supplement
ProtocolSupplement 1->N SupplementSchedule
SupplementSchedule N->1 TimeBlock
SupplementSchedule 1->N DailyLog
```

### Constraints
- DailyLog: unique on (scheduleId, date) — prevents double checking off the same schedule on the same day

---

## Multi-protocol aggregation

Dashboard collects schedules from ALL active protocols (protocol.status = active). Query `get-daily-status`:
- JOIN protocolSupplements + supplementSchedules WHERE protocolSupplement.active = true AND protocol.status = active
- Groups by timeBlock, sorts by sortOrder
- Attaches Supplement info (name, isCritical, currentStock) and DailyLog per date

If user has Protocol A and Protocol B, both with NAC in the "Śniadanie" block — the dashboard shows two separate schedule entries, both linking to the same Supplement. Both decrement the same stock.

---

## Protocol archival

- `protocol.status → archived`
- All related `protocolSupplements.active → false`
- Archived protocol supplements disappear from dashboard and do not count toward dailyUsage
- Reactivation: `protocol.status → active`, `protocolSupplements.active → true`
- Archival does NOT delete data — historical DailyLog entries remain

---

## Deleting a supplement

- Deleting a supplement (supplement.active → false) cascades deactivation to all related protocolSupplements (protocolSupplement.active → false)
- Deactivated protocol supplements disappear from dashboard
- Soft delete — data remains but is not visible in UI
- Historical DailyLog entries remain intact

---

## Deleting / editing a time block

- Deletion (soft delete: `timeBlock.active → false`) — blocked if there are active schedules assigned to this block. User must first move schedules to another block or deactivate them.
- Editing name/icon/startTime — no restrictions, change propagates to dashboard
- Reordering (sortOrder) — drag & drop or up/down arrows

---

## Adding a new protocol (non-onboarding)

Flow for a user who already has an account and a protocol:
1. Settings > "Add new protocol" → navigates to `/protocol/new` (separate route, NOT `/onboarding/`)
2. Upload → parse → preview (reuse upload-step + parsed-preview components)
3. AI receives existing user Supplements → links to them
4. Confirmation → creates new Protocol + SupplementSchedule entries
5. Redirect back to `/dashboard` (does NOT change onboardingStep)

Routing:
- `/onboarding/*` — only for new users (onboardingStep != complete), checks step
- `/protocol/new` — for existing users, reuses the same components (upload-step, parsed-preview)
- Both flows use the same actions: `save-draft-protocol.ts`, `create-protocol.ts`

Differences vs onboarding:
- Separate route (`/protocol/new` vs `/onboarding/upload`)
- No step indicator
- Does not change `user.onboardingStep` (remains `complete`)
- AI has more existing Supplements to link to

---

## Stock logic

- Stock is on Supplement (one box). Schedule references the box from the shelf.
- Stock is in the same unit as the schedule's dosageUnit. In practice one supplement = one dosage form (capsules, drops, ml). UI does not enforce this, but AI parses consistently.
- Decrement on check: `supplement.currentStock -= schedule.dosageAmount`
- Undo check: `supplement.currentStock += schedule.dosageAmount`
- dailyUsage per Supplement: `SUM(schedule.dosageAmount)` from all active schedules
- Replenish: `supplement.currentStock += amount`
- Correction (update): `supplement.currentStock = new_value`
- Set (enable tracking): `supplement.currentStock = value` (from null to value — activates tracking)
- **Floor: stock does NOT go below 0.** `Math.max(0, currentStock - dosageAmount)`. Checking off at stock = 0 → stock stays at 0 (we do not block checking off).

## Cost logic

- Cost per unit: `packagePrice / packageSize`
- Daily cost: `cost_per_unit * dailyUsage`
- Monthly cost: `daily_cost * 30`
- We display just the number (without currency)
- Both fields (packagePrice, packageSize) must be filled in to calculate cost

Product requirements → `PRD_PillPilot.md` > US-18 (V2).

---

## Onboarding State Machine

```
upload -> preview -> complete
```

- Persisted in `user.onboardingStep`
- Parsed data in `protocol.parsedData` (status: draft)
- After confirmation: protocol status → active, onboardingStep → complete
- User can close the browser and return to the same step

Stock setup in onboarding → WEEK 1 (after protocol confirmation, before dashboard).

---

## Time Block — active block logic

Blocks are per-user, stored in the `timeBlocks` table (see Data Model). Active block on dashboard:

- Blocks sorted by `sortOrder`. Each block lasts from its `startTime` until the `startTime` of the next block
- Active = the block whose `startTime` is closest in the past (or equal to the current time)
- On dashboard, expanded by default: active block + first incomplete block
- If all blocks are complete → all collapsed

---

## AI Parsing - Output Schema

### AI Input — user context

AI receives the full user context before parsing:
```typescript
{
  supplements: [{ id, name, brandName }],     // existing inventory
  timeBlocks: [{ id, name, startTime }],            // user's time blocks
}
```

### AI Output Schema

```typescript
{
  protocolName: string,
  supplements: [
    {
      name: string,
      existingSupplementId: string | null,  // ID from context or null (new)
      brandName: string | null,             // if new
      category: "medication" | "supplement" | "vitamin" | "mineral" | "probiotic" | "herb" | "amino_acid" | "other",
      isCritical: boolean,
      confidence: number,                    // 0.0-1.0
      schedules: [
        {
          dosageAmount: number,
          dosageUnit: DosageUnit,
          timeBlockId: string,               // ID of block from user's context
          notes: string | null,              // e.g. "30 min before meal"
        }
      ]
    }
  ]
}
```

### System prompt rules
- You receive full user context: supplements (id + name + brandName) and timeBlocks (id + name + startTime)
- If a supplement from the protocol matches an existing one → set existingSupplementId to its ID
- If it doesn't match → existingSupplementId = null (will be created)
- timeBlockId = ID of the user's block. Match doses to blocks by name/time (e.g. "morning" → "Na czczo" or "Śniadanie"). If no match → use the closest by time
- Prescription medications = medication + isCritical
- Same supplement in multiple blocks = one supplement, multiple schedules
- Confidence 0-1 (how certain you are about the linking / parsing)

### File handling

Uploaded file (PDF/Excel) is ephemeral:
1. Frontend sends file to `POST /api/protocol/parse`
2. API route extracts content and sends to AI
3. AI returns parsed JSON
4. JSON saved in `protocol.parsedData` (status: draft)
5. File is NOT persisted — no file storage (S3 etc.)

Product requirements → `PRD_PillPilot.md` > US-1, US-2, AI Parsing.
