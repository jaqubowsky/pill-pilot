# PillPilot - PRD (Product Requirements Document)

## Overview

PillPilot is a PWA for tracking supplementation and medications. The user uploads a treatment protocol (PDF/Excel/DOCX/image/text), AI parses it, links it to existing inventory or creates new items, and guides the user through the daily plan.

**Key principle: ZERO manual data entry.** AI does 95% of the work.

Related documents:
- `design.md` — design system, components, screen wireframes
- `tech-stack.md` — stack, conventions, folder structure
- `technical-requirements.md` — data model, schemas, business logic
- `ROADMAP.md` — implementation checklist

---

## Phases

| Phase | What | When |
|-------|------|------|
| **MVP** | Auth (Google) + AI import (PDF/Excel/DOCX/image/text) + Dashboard (daily/weekly/monthly) + Checking off + Stock (view, replenish, adjust, forecast) + Manual supplement addition + Manual protocol creation + Time blocks (management) + Edit/delete + Settings + Basic PWA + Push notifications | Day 1 |
| **V2** | Cost summary + purchase forecast + skip with reason + critical reminders + animations | Later |
| **LATER** | Export | Someday |

---

## Core Concepts

### Supplement = your inventory (cabinet)

A Supplement belongs to the user, NOT to the protocol. It's your physical box in the cabinet. NAC is one Supplement with one stock state — regardless of how many protocols use it.

Each supplement can optionally have: package price and package size. Based on this we calculate cost per unit, daily cost, monthly cost in the summary (no currency — just a number). Calculation details → `technical-requirements.md` > Cost logic.

### Protocol = dosage plan

A Protocol creates SupplementSchedule entries that link directly to Supplements and TimeBlocks. "NAC 2 caps morning and 2 caps evening" = two schedule entries linking to one Supplement.

### AI linking

When parsing a new protocol, AI:
1. Checks what supplements the user already has in inventory
2. Links schedules to existing ones (e.g., "NAC" in protocol -> NAC from inventory)
3. Creates new Supplements for those the user doesn't have
4. Marks uncertain links with low confidence

AI output schema details → `technical-requirements.md` > AI Parsing.

### Time Blocks

Defaults: Fasting, Breakfast, Lunch, Dinner, Before bed. The user can add, edit, delete, and reorder blocks. Blocks are per-user, stored in the database. Data model details → `technical-requirements.md` > Data Model > TimeBlock.

### Tracking

No auto-skip. Unchecked = unchecked. Stats: marked vs total per day.

### Protocol creation flow

Step-by-step flow: upload -> AI processes in background -> preview/edit -> confirm. Manual protocol creation also available (form-based, without AI). State machine details → `technical-requirements.md`.

---

## User Stories

### MVP

#### US-1: Upload and parse protocol [MVP] ✅
**As** a user,
**I want** to upload a protocol (PDF/Excel/DOCX/image/text),
**so that** AI recognizes supplements and links them with my inventory.

**Acceptance Criteria:**
- Available from: Settings > "Add protocol"
- Supported formats: PDF, Excel (.xlsx/.xls), DOCX, images (JPEG/PNG/WebP/GIF), plain text
- AI parses in background (two-step: extraction via Haiku → enrichment via Sonnet) -> checks existing user Supplements -> links or creates new
- Protocol status: processing → draft (on success) or failed (on error)
- Preview: supplements grouped by blocks, marked:
  - ✅ Linked with existing stock (e.g., "NAC -> NAC (Apollo's Hegemony) - 87 pcs in stock")
  - 🆕 New supplement (will be added to inventory)
  - ⚠️ Confidence < threshold (user must verify)
- Confirmation -> creates schedule entries + new Supplements
- User can provide custom instructions for AI parsing

#### US-2: Edit parsed preview [MVP] ✅
**As** a user,
**I want** to correct AI errors and change inventory links.

**Acceptance Criteria:**
- Inline editing: name, dose (amount + unit), block, notes, category, isCritical, cycling, startDayOffset, durationDays, dosageIntervalMinutes, waitAfterTakingMinutes
- Change linking: AI linked NAC to the wrong Supplement? Switch to another from the list
- Deleting, adding, moving to another block
- ⚠️ must be verified before confirmation

#### US-3: Daily dashboard [MVP] ✅
**As** a user,
**I want** to see today's plan divided into blocks.

**Acceptance Criteria:**
- Date + progress ring
- Blocks (accordion, dynamic list from database), active one expanded
- Critical items marked
- Date navigation
- Unchecked items remain unchecked
- View switcher: daily / weekly / monthly

#### US-3b: Weekly dashboard [MVP] ✅
**As** a user,
**I want** to see a weekly summary of my supplement adherence.

#### US-3c: Monthly dashboard [MVP] ✅
**As** a user,
**I want** to see a monthly calendar view of my supplement adherence.

#### US-4: Checking off [MVP] ✅
**Acceptance Criteria:**
- Tap -> DailyLog with takenAt, decrements stock (if != null)
- Second tap -> unchecks with confirmation
- "Check off entire block" with confirmation
- Optimistic UI
- Timer support: dosageIntervalMinutes (cooldown between doses), waitAfterTakingMinutes (post-take wait timer with notifications)
- Timer adjustment and skip actions

#### US-5: Manual supplement addition [MVP] ✅
**As** a user,
**I want** to add a supplement manually to inventory.

**Acceptance Criteria:**
- Adding to inventory: name, brand (optional), category, stockUnit, stock, package size (optional), package price (optional)
- If supplement doesn't exist in inventory -> create it

#### US-5b: Time block management [MVP] ✅
**As** a user,
**I want** to customize time blocks to match my lifestyle.

**Acceptance Criteria:**
- Available from: Settings > Time blocks
- Edit: name, icon (Lucide), start time
- Adding a new block
- Reordering (drag and drop via @dnd-kit)
- Deleting (blocked if block has active schedules)
- Default 5 blocks created on registration

#### US-6: Edit and delete [MVP] ✅
**Acceptance Criteria:**
- Edit Supplement (name, brand, category, stockUnit, package size, package price) — from stock page
- Edit Schedule (dose, block, notes, criticality, cycling, timing) — from dashboard supplement row
- Deactivate schedule (disappears from dashboard)
- Delete supplement (soft delete + cascading deactivation of related schedules)
- Archive protocol (from Settings — deactivates all schedules, reversible)
- Delete protocol (from Settings)
- Edit protocol (re-open preview to modify and re-confirm)

#### US-7: Basic PWA [MVP] ✅
**Acceptance Criteria:**
- Manifest, standalone, service worker, static asset caching
- Install prompt on mobile

#### US-8: Stock basics [MVP] ✅
**Acceptance Criteria:**
- currentStock on Supplement (nullable, decimal — supports fractional units like ml, g)
- Checking off decrements (currentStock -= dosageAmount)
- "Inventory" view (list of boxes with stock)
- Sorting: lowest on top

#### US-9: Replenish [MVP] ✅
**Acceptance Criteria:**
- "Replenish" -> input how much you bought -> ADDS to currentStock
- "Set" (for supplements with stock = null) -> input how much you have -> SETS currentStock (activates tracking)

#### US-10: Manual stock adjustment [MVP] ✅
**Acceptance Criteria:**
- "Adjust" -> overwrites currentStock

#### US-14: Manual protocol creation [MVP] ✅
**As** a user,
**I want** to create a protocol manually without AI.

**Acceptance Criteria:**
- Form for manual protocol creation (name, supplements with doses and blocks)
- Can pick existing supplements from inventory or create new ones inline

#### US-15: Stock forecast/alerts [MVP] ✅
**Acceptance Criteria:**
- Depletion date forecast (day-by-day simulation respecting cycling, startDayOffset, durationDays)
- Progress bar on stock items
- Stock warning threshold per supplement
- "Buy soon" list on stock page
- Low-stock badge on dashboard
- Stock calculator action

#### US-16: Push notifications [MVP] ✅
**Acceptance Criteria:**
- Per time block, toggle on/off
- Notification settings in Settings
- Push subscription management
- Timer-based notifications for wait-after-taking supplements
- Test notification support

---

### V2

- US-18: Cost summary (daily/monthly cost per supplement and total, based on price and package size)
- US-19: Purchase forecast
- US-20: Skip with reason
- US-21: Critical medication reminders
- US-22: Animations

### LATER

- US-25: History export

---

## Screens

Wireframes and detailed visual description → `design.md` > Screens.

Screens: Login, Protocol Upload, Protocol Preview, Protocol Manual Form, Protocol Edit, Dashboard (daily/weekly/monthly), Stock/Inventory, Settings.

---

## Multiple protocols

The Dashboard aggregates schedules from ALL active protocols. If the user has Protocol A and Protocol B, both with NAC — both doses appear on the dashboard and both decrement the stock of the same Supplement.

A per-protocol view is not required in MVP — the dashboard is a flat list of blocks/doses.

---

## Protocol archiving

- User archives a protocol from Settings > Protocol section
- Archiving = protocol.status → archived, all related schedules.active → false
- Archived schedules disappear from the dashboard and stop counting toward dailyUsage/stock
- Archiving is reversible (reactivation restores schedules)

---

## AI Parsing [MVP]

- Available from: Settings > "Add protocol"
- Input: PDF (.pdf), Excel (.xlsx/.xls), DOCX (.docx), images (JPEG/PNG/WebP/GIF), plain text (.txt)
- Max file size: 10 MB
- File is ephemeral — sent to AI API, parsed, not persisted on the server
- Two-step process: extraction (Haiku) → enrichment (Sonnet) with user context
- AI checks existing user inventory and links to it (or creates new)
- Prescription medications automatically marked as critical
- Confidence 0-1 per supplement (linking/parsing certainty)
- Same supplement in multiple blocks = one box, multiple doses
- Protocol created with status "processing", updated to "draft" on success or "failed" on error (uses `after()` for background processing)
- User can provide custom instructions to guide AI interpretation
- Rate limited: 5 requests per minute per user

**Error path:**
- File unreadable / wrong format → error toast, user can retry
- AI cannot parse (no supplements in file) → protocol status set to "failed"
- Timeout / API error → protocol status set to "failed"

Technical details (output schema, system prompt) → `technical-requirements.md` > AI Parsing.

---

## Where edit / delete UI lives

| Action | Available from |
|--------|---------------|
| Edit Supplement (name, brand, category, stockUnit, packageSize, packagePrice) | Stock page → tap on item → edit sheet |
| Edit Schedule (dose, block, notes, criticality, cycling, timing) | Dashboard → tap on supplement row → edit sheet |
| Delete supplement | Stock page → edit sheet → "Delete" |
| Add supplement to inventory | Stock page → "Add supplement" button |
| Add new protocol (AI) | Settings > "Add protocol" |
| Add new protocol (manual) | Settings > "Add protocol" → manual option |
| Archive/reactivate protocol | Settings > Protocol section → protocol card |
| Delete protocol | Settings > Protocol section → protocol card |
| Edit protocol | Settings > Protocol section → protocol card → edit button |
| Edit/add/delete time block | Settings > Time blocks section |
| Notification settings | Settings > Notification section |

---

## Settings

### Protocol section
- List of active and archived protocols
- Per protocol: name, status, supplement count, "Archive"/"Reactivate", "Delete", "Edit"
- "Add new protocol" → trigger AI parsing flow or manual form
- Processing protocols show animated status

### Time blocks section
- Block list (sortable via drag-and-drop): name, icon, start time
- Tap on block → edit sheet (name, icon, start time)
- "Add block" → new block
- Delete block (blocked if it has active schedules)

### Notification section
- Per time block notification toggle
- Notification time configuration
- Test notification button

### Account section
- Email (read-only)
- "Log out"

---

## Out of Scope (all versions)

- Shared product database between users
- Pharmacy integration
- Supplement photos
- Protocol sharing
- Apple Health / Google Fit
- AI chatbot
- Dark mode
- Currency (prices as numbers without currency)
