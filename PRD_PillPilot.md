# PillPilot - PRD (Product Requirements Document)

## Overview

PillPilot is a PWA for tracking supplementation and medications. The user uploads a treatment protocol (PDF/Excel), AI parses it, links it to existing inventory or creates new items, and guides the user through the daily plan.

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
| **MVP** | Auth (Google) + AI import (PDF/Excel) + Dashboard + Checking off + Stock (view, replenish, adjust) + Manual supplement addition + Time blocks (management) + Edit/delete + Settings + Basic PWA | Day 1 |
| **WEEK 1** | Offline queue + Stock setup in onboarding + Bulk delete + "Add manually" + Stock forecast/alerts + Push notifications + Integration tests | Week after MVP |
| **V2** | Cost summary + purchase forecast + skip with reason + critical reminders + animations | Later |
| **LATER** | Weekly/monthly views + export | Someday |

---

## Core Concepts

### Supplement = your inventory (cabinet)

A Supplement belongs to the user, NOT to the protocol. It's your physical box in the cabinet. NAC is one Supplement with one stock state — regardless of how many protocols use it.

Each supplement can optionally have: package price and package size. Based on this we calculate cost per unit, daily cost, monthly cost in the summary (no currency — just a number). Calculation details → `technical-requirements.md` > Cost logic.

### Protocol = dosage plan

A Protocol creates SupplementSchedule entries that link to your Supplements. "NAC 2 caps morning and 2 caps evening" = two schedule entries linking to one Supplement.

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

### Onboarding

Step-by-step flow: upload -> preview/edit -> confirm. The user can close and return to the same step. State machine details → `technical-requirements.md` > Onboarding State Machine.

---

## User Stories

### MVP

#### US-1: Upload and parse protocol [MVP]
**As** a user,
**I want** to upload a protocol (PDF/Excel),
**so that** AI recognizes supplements and links them with my inventory.

**Acceptance Criteria:**
- Available in: onboarding (first protocol) + adding a new protocol (settings/dashboard)
- 2 options: "Upload PDF", "Upload Excel"
- AI parses -> checks existing user Supplements -> links or creates new
- Preview: supplements grouped by blocks, marked:
  - ✅ Linked with existing stock (e.g., "NAC -> NAC (Apollo's Hegemony) - 87 pcs in stock")
  - 🆕 New supplement (will be added to inventory)
  - ⚠️ Confidence < 0.7 (user must verify)
- Confirmation -> creates schedule entries + new Supplements
- State machine: user can close and return

#### US-2: Edit parsed preview [MVP]
**As** a user,
**I want** to correct AI errors and change inventory links.

**Acceptance Criteria:**
- Inline editing: name, dose (amount + unit), block, notes, category, isCritical
- Change linking: AI linked NAC to the wrong Supplement? Switch to another from the list
- Deleting, adding, moving to another block
- ⚠️ must be verified before confirmation

#### US-3: Daily dashboard [MVP]
**As** a user,
**I want** to see today's plan divided into blocks.

**Acceptance Criteria:**
- Date + progress ring
- Blocks (accordion, dynamic list from database), active one expanded
- Critical items marked
- Date navigation
- Unchecked items remain unchecked

#### US-4: Checking off [MVP]
**Acceptance Criteria:**
- Tap -> DailyLog with takenAt, decrements stock (if != null)
- Second tap -> unchecks with confirmation
- "Check off entire block" with confirmation
- Optimistic UI

#### US-5: Manual supplement addition [MVP]
**As** a user,
**I want** to add a supplement manually to inventory and/or to a protocol.

**Acceptance Criteria:**
- Adding to inventory: name, brand (optional), category, isCritical, stock, package size (optional), package price (optional)
- Adding schedule to protocol: select from inventory + dose + block
- If supplement doesn't exist in inventory -> create + add schedule

#### US-5b: Time block management [MVP]
**As** a user,
**I want** to customize time blocks to match my lifestyle.

**Acceptance Criteria:**
- Available from: Settings > Time blocks
- Edit: name, icon (Lucide), start time
- Adding a new block
- Reordering
- Deleting (blocked if block has active schedules)
- Default 5 blocks created on registration

#### US-6: Edit and delete [MVP]
**Acceptance Criteria:**
- Edit Supplement (name, brand, category, isCritical, package size, package price)
- Edit Schedule (dose, block, notes)
- Deactivate schedule (disappears from dashboard)
- Delete supplement (soft delete + cascading deactivation of related schedules)
- Archive protocol (from Settings — deactivates all schedules, reversible)

#### US-7: Basic PWA [MVP]
**Acceptance Criteria:**
- Manifest, standalone, service worker, static asset caching
- Install prompt on mobile

#### US-8: Stock basics [MVP]
**Acceptance Criteria:**
- currentStock on Supplement (nullable, decimal — supports fractional units like ml, g)
- Checking off decrements (currentStock -= dosageAmount)
- "Inventory" view (list of boxes with stock)
- Sorting: lowest on top

#### US-9: Replenish [MVP]
**Acceptance Criteria:**
- "Replenish" -> input how much you bought -> ADDS to currentStock
- "Set" (for supplements with stock = null) -> input how much you have -> SETS currentStock (activates tracking)

#### US-10: Manual stock adjustment [MVP]
**Acceptance Criteria:**
- "Adjust" -> overwrites currentStock

---

### WEEK 1

#### US-11: Stock setup in onboarding [WEEK 1]
- Optional step after protocol confirmation: list of unique Supplements, input "How much do you have left?"
- "Skip" -> stock = null

#### US-12: Offline queue [WEEK 1]
- IndexedDB queue + background sync
- Checking off offline -> sync when back online

#### US-13: Bulk delete [WEEK 1]
- Select multiple supplements/schedules -> delete with one click

#### US-14: "Add manually" protocol [WEEK 1]
- Third upload option: form for manual protocol creation (without AI)

#### US-15: Stock forecast/alerts [WEEK 1]
- Depletion date forecast, progress bar, alert threshold (user chooses)
- "To buy" view, badge on dashboard

#### US-16: Push notifications [WEEK 1]
- Per block, toggle on/off, reminder 30 min

#### US-17: Integration tests [WEEK 1]
- Core logic: parsing, linking to inventory, checking off, stock decrementation

---

### V2

- US-18: Cost summary (daily/monthly cost per supplement and total, based on price and package size)
- US-19: Purchase forecast
- US-20: Skip with reason
- US-21: Critical medication reminders
- US-22: Animations

### LATER

- US-23: Weekly view
- US-24: Monthly view
- US-25: History export

---

## Screens

Wireframes and detailed visual description → `design.md` > Screens.

MVP screens: Login, Onboarding (Upload, Preview), Dashboard, Inventory, Settings.

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

- Available in: onboarding (first protocol) + adding a new protocol (Settings > "Add protocol")
- Input: PDF (.pdf) or Excel (.xlsx)
- Max file size: 10 MB
- File is ephemeral — sent to AI API, parsed, not persisted on the server
- AI checks existing user inventory and links to it (or creates new)
- Prescription medications automatically marked as critical
- Confidence 0-1 per supplement (linking/parsing certainty)
- Same supplement in multiple blocks = one box, multiple doses

**Error path:**
- File unreadable / wrong format → error toast, user can retry
- AI cannot parse (no supplements in file) → message "No supplements found" + suggestion to check the file
- Timeout / API error → "Something went wrong, try again"

Technical details (output schema, system prompt) → `technical-requirements.md` > AI Parsing.

---

## Where edit / delete UI lives

| Action | Available from |
|--------|---------------|
| Edit Supplement (name, brand, category, isCritical) | Stock page → tap on item → edit sheet |
| Edit Schedule (dose, block, notes) | Settings > Protocol section → tap on schedule |
| Deactivate schedule | Settings > Protocol section → toggle |
| Delete supplement | Stock page → swipe or edit sheet → "Delete" |
| Add supplement to inventory | Stock page → "Add supplement" button |
| Add schedule to protocol | Settings > Protocol section → "Add dose" |
| Add new protocol (AI) | Settings > "Add protocol" |
| Archive protocol | Settings > Protocol section → "Archive" |
| Edit/add/delete time block | Settings > Time blocks section |

---

## Settings

### Protocol section
- List of active protocols with their schedules
- Per protocol: name, status, schedule list (editable), "Archive"
- "Add dose" (new schedule to existing protocol)
- "Add new protocol" → trigger AI parsing flow (upload → preview → confirm)

### Time blocks section
- Block list (sortable): name, icon, start time
- Tap on block → edit sheet (name, icon, start time)
- "Add block" → new block
- Delete block (blocked if it has active schedules)

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
