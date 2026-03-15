# PillPilot - Roadmap & Checklist

Related documents:

- `PRD_PillPilot.md` — product requirements, user stories
- `design.md` — design system, components, screen wireframes
- `tech-stack.md` — stack, conventions, folder structure
- `technical-requirements.md` — data model, schemas, business logic

Mark `[x]` when completed.

---

## MVP (Day 1)

### 1. Project Setup

> Design system → `design.md` (tokens, fonts, shadcn theming)

- [x] Next.js 16, Tailwind CSS 4, shadcn/ui
- [x] Design system: `globals.css` with @theme tokens from `design.md` (colors, fonts, shadows, spacing)
- [x] Fonts: DM Serif Display + Plus Jakarta Sans via `next/font`
- [x] shadcn/ui theming: override default colors with our tokens (→ `design.md` > shadcn/ui theming)
- [x] next-intl (pl, `useTranslations()`)
- [x] `src/shared/i18n/messages/pl.json` + `config.ts`
- [x] Path aliases, `.env.local`
- [x] `next-safe-action` + `src/shared/lib/safe-action.ts`
- [x] Biome (lint + format)
- [x] Folder structure (MVP only)

### 2. Database

> Data model → `technical-requirements.md` > Data Model

- [x] `pg` + `drizzle-orm` + `drizzle-kit`
- [x] `src/shared/db/client.ts` (PostgreSQL via `pg`)
- [x] `src/shared/db/schema.ts`:
  - [x] `users` (id, email, name, createdAt, settings)
  - [x] `timeBlocks` (id, userId, name, icon, startTime, sortOrder, active, createdAt)
  - [x] `supplements` (id, userId, name, brandName, category, isCritical, currentStock [decimal], packageSize, packagePrice, active, createdAt)
  - [x] `protocols` (id, userId, name, parsedData, status: draft|active|archived, createdAt)
  - [x] `protocolSupplements` (id, protocolId, supplementId, notes, cycleStartDate, cycleDaysOn, cycleDaysOff, sortOrder, active)
  - [x] `supplementSchedules` (id, protocolSupplementId, timeBlockId, dosageAmount, dosageUnit)
  - [x] `dailyLogs` (id, scheduleId, date, takenAt)
- [x] Migration
- [x] Seed: default TimeBlocks on registration (Na czczo, Śniadanie, Obiad, Kolacja, Przed snem)
- [x] Repositories:
  - [x] `src/shared/repositories/time-block-repository.ts`
  - [x] `src/shared/repositories/supplement-repository.ts`
  - [x] `src/shared/repositories/protocol-repository.ts`
  - [x] `src/shared/repositories/supplement-schedule-repository.ts`
  - [x] `src/shared/repositories/protocol-supplement-repository.ts`
  - [x] `src/shared/repositories/user-repository.ts`
  - [x] `src/shared/repositories/daily-log-repository.ts`

### 3. Auth

- [x] `better-auth` + `src/shared/lib/auth.ts`
- [x] Google OAuth
- [x] `src/app/api/auth/[...all]/route.ts`
- [x] `src/shared/hooks/use-current-user.ts`
- [x] `src/app/(auth)/login/page.tsx`
- [x] Middleware + redirect

### 4. AI Parsing

> AI output schema → `technical-requirements.md` > AI Parsing

- [x] `ai` + `@ai-sdk/anthropic` + `src/shared/lib/ai.ts`
- [x] `src/features/protocol-wizard/schemas/parsed-protocol-schema.ts` (Level 2)
- [x] `src/app/api/protocol/parse/route.ts`
  - [x] Accepts PDF/Excel + full user context (supplements + timeBlocks with IDs)
  - [x] AI links to existing Supplements and TimeBlocks by ID
  - [x] Confidence 0-1 per supplement
- [ ] Test with H. pylori Excel

### 5. Protocol Wizard - Upload

> PRD → US-1. → `technical-requirements.md` > Adding a new protocol.

- [x] `src/app/(app)/(main)/protocol/new/page.tsx`
- [x] `features/protocol-wizard/components/upload-step/upload-step.tsx`
- [x] `features/protocol-wizard/components/upload-step/use-upload-step.ts` (Level 1)
- [x] `features/protocol-wizard/components/upload-step/use-parse-protocol.ts` (Level 1)
- [x] `features/protocol-wizard/components/upload-step/file-dropzone/` (folder: component + hook)
- [x] `features/protocol-wizard/components/upload-step/index.ts`
- [x] 2 options: "Upload PDF", "Upload Excel"
- [x] After parsing -> save draft -> redirect to preview

### 6. Protocol Wizard - Preview and editing

> PRD → US-1, US-2

- [x] `src/app/(app)/(main)/protocol/new/preview/[id]/page.tsx`
- [x] Loads from Protocol (status: draft)
- [x] `features/protocol-wizard/components/parsed-preview/parsed-preview.tsx`
- [x] `features/protocol-wizard/components/parsed-preview/use-parsed-preview.ts` (Level 1)
- [x] `features/protocol-wizard/components/parsed-preview/parsed-preview.schema.ts` (Level 1)
- [x] `features/protocol-wizard/components/parsed-preview/preview-block.tsx`
- [x] `features/protocol-wizard/components/parsed-preview/preview-supplement-row/` (folder)
  - [x] Linked to inventory (name + stock)
  - [x] New (will be added to inventory)
  - [x] Confidence < threshold (user must verify)
  - [x] `supplement-link-badge.tsx`, `confidence-badge.tsx`
- [x] `features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/` (folder: edit supplement inline)
- [x] `features/protocol-wizard/components/parsed-preview/index.ts`
- [x] Inline editing: name, dosage (number + unit), time block, notes, category, isCritical
- [x] Change linking: switch to a different Supplement from inventory (select)
- [x] "Approve" (blocked if unverified):
  - [x] `features/protocol-wizard/api/actions/create-protocol.ts` (next-safe-action)
  - [x] Creates new Supplements (for new) in user's inventory
  - [x] Creates SupplementSchedule entries linking to Supplements
  - [x] Protocol status: active
  - [x] Redirect `/dashboard`
- [x] `features/protocol-wizard/api/actions/save-draft-protocol.ts` (next-safe-action, auto-save)
- [x] `features/protocol-wizard/api/queries/get-protocol-for-preview.ts`
- [x] `src/app/(app)/(main)/protocol/edit/[id]/page.tsx` — edit existing protocol

### 7. Dashboard

> PRD → US-3

- [x] `src/app/(app)/(main)/dashboard/page.tsx`
- [x] `features/dashboard/api/queries/get-daily-status.ts` (Level 2)
  - [x] Aggregates schedules from ALL active protocols (→ `technical-requirements.md` > Multi-protocol aggregation)
  - [x] Schedules + logs per day, per time block, with Supplement info (name, isCritical, stock)
- [x] `features/dashboard/components/daily-view/daily-view.tsx`
- [x] `features/dashboard/components/daily-view/use-daily-view.ts` (Level 1)
- [x] `features/dashboard/components/daily-view/date-navigator/` (folder: component + hook)
- [x] `features/dashboard/components/daily-view/progress-ring/` (folder: component + hook + icon)
- [x] `features/dashboard/components/daily-view/index.ts`
- [x] `features/dashboard/components/time-block/time-block.tsx`
- [x] `features/dashboard/components/time-block/time-block-header.tsx`
- [x] `features/dashboard/components/time-block/time-block-progress.tsx`
- [x] `features/dashboard/components/time-block/index.ts`
- [x] `features/dashboard/components/supplement-row/supplement-row.tsx`
- [x] `features/dashboard/components/supplement-row/use-supplement-row.ts` (Level 1)
- [x] `features/dashboard/components/supplement-row/use-check-supplement.ts` (Level 1)
- [x] `features/dashboard/components/supplement-row/supplement-checkbox.tsx`
- [x] `shared/components/critical-badge.tsx` (promoted to Level 3)
- [x] `features/dashboard/components/supplement-row/index.ts`
- [x] `features/dashboard/components/check-all-button/check-all-button.tsx` + `index.ts`

### 8. Checking off

> PRD → US-4. Stock logic → `technical-requirements.md` > Stock logic.

- [x] `features/dashboard/api/actions/mark-taken.ts` (next-safe-action)
  - [x] Creates DailyLog + decrements supplement.currentStock (if != null)
- [x] `features/dashboard/api/actions/mark-untaken.ts` (next-safe-action, deletes DailyLog + increments stock back)
- [x] `features/dashboard/api/actions/mark-block-taken.ts` (next-safe-action)
- [x] Unchecking with confirmation
- [x] Optimistic UI

### 9. Stock Basics

> PRD → US-8, US-9, US-10

- [x] `features/stock/api/queries/get-stock-list.ts` (Level 2)
  - [x] User's supplements with currentStock + dailyUsage (SUM schedules)
- [x] `src/app/(app)/(main)/stock/page.tsx`
- [x] `features/stock/components/stock-list/stock-list.tsx`
  - [x] `use-stock-list.ts` (Level 1)
  - [x] Sections: with stock (sort: lowest on top) / without tracking
- [x] `features/stock/components/stock-list/stock-item/` (folder: component + hook)
  - [x] Name, brand, stock, [Replenish] [Adjust]
- [x] `features/stock/components/stock-list/adjust-dialog/` (folder: component + hook)
- [x] `features/stock/components/stock-list/restock-dialog/` (folder: component + hook)
- [x] `features/stock/components/stock-list/supplement-edit-sheet/` (folder: component + hook)
- [x] `features/stock/components/stock-list/index.ts`
- [x] `features/stock/api/actions/replenish-stock.ts` (ADDS to currentStock)
- [x] `features/stock/api/actions/update-stock.ts` (OVERWRITES currentStock)

### 10. Supplement management

> PRD → US-5, US-6

- [x] `features/supplements/components/supplement-form/supplement-form.tsx`
- [x] `features/supplements/components/supplement-form/supplement-form.schema.ts` (Level 1)
- [x] `features/supplements/components/supplement-form/supplement-fields.tsx`
- [x] `features/supplements/components/supplement-form/dosage-input.tsx`
- [x] `features/supplements/components/supplement-form/index.ts`
- [x] `features/supplements/components/schedule-form/schedule-form.tsx`
- [x] `features/supplements/components/schedule-form/schedule-form.schema.ts` (Level 1)
- [x] `features/supplements/components/schedule-form/schedule-fields.tsx`
- [x] `features/supplements/components/schedule-form/index.ts`
- [x] `features/supplements/api/actions/add-supplement.ts` (adds to inventory)
- [x] `features/supplements/api/actions/add-schedule.ts` (adds schedule, links to existing Supplement)
- [x] `features/supplements/api/actions/update-supplement.ts`
- [x] `features/supplements/api/actions/update-schedule.ts`
- [x] `features/supplements/api/actions/toggle-schedule.ts`
- [x] `features/supplements/api/actions/delete-supplement.ts` (soft delete: active → false + cascading schedules.active → false)
- [x] `features/supplements/api/queries/get-user-supplements.ts`

### 11. Settings

> PRD → Settings. Archiving → `technical-requirements.md` > Protocol archiving.

- [x] `src/app/(app)/(main)/settings/page.tsx`
- [x] `features/settings/components/settings-page/settings-page.tsx` + sections + barrels
- [x] Protocol section:
  - [x] `use-protocol-section.ts` (Level 1)
  - [x] `protocol-card/` (folder: component + hook)
  - [x] `schedule-edit-sheet/` (folder: component + hook)
  - [x] `add-dose-sheet/` (folder: component + hook)
  - [x] List of active protocols with their schedules
  - [x] Per protocol: name, schedule list (editable), "Archive"
  - [x] "Add dosage" (new schedule to existing protocol)
  - [x] "Add new protocol" → navigates to `/protocol/new`
- [x] Time blocks section:
  - [x] `features/settings/components/settings-page/time-blocks-section/time-blocks-section.tsx` + `use-time-blocks-section.ts` + `index.ts`
  - [x] `features/settings/components/settings-page/time-blocks-section/time-block-row/` (folder: component + hook)
  - [x] `features/settings/components/settings-page/time-blocks-section/time-block-edit-sheet/` (folder: component + hook)
  - [x] `features/settings/components/settings-page/time-blocks-section/icon-picker.tsx`
  - [x] List of time blocks (name, icon, time), tap → edit sheet
  - [x] "Add time block"
  - [x] Deletion (blocked if has active schedules)
  - [x] `features/settings/api/actions/add-time-block.ts`
  - [x] `features/settings/api/actions/update-time-block.ts`
  - [x] `features/settings/api/actions/delete-time-block.ts`
  - [x] `features/settings/api/actions/reorder-time-blocks.ts`
  - [x] `features/settings/api/queries/get-user-protocols.ts` (protocols with their schedules)
  - [x] `features/settings/api/queries/get-user-time-blocks.ts`
- [x] Account section: email (read-only), "Sign out"
- [x] `features/settings/api/actions/archive-protocol.ts` (protocol.status → archived, schedules.active → false)
- [x] `features/settings/api/actions/reactivate-protocol.ts` (reverse of archiving)

### 12. Navigation

- [x] `src/app/(app)/(main)/layout.tsx` (bottom nav: Today | Stock | Settings)
- [x] Icons, active state, mobile first

### 13. Basic PWA

> PRD → US-7

- [x] `src/app/manifest.ts`
- [x] Service worker (cache static assets) — `public/sw.js`, registered via `ServiceWorkerRegistrar`
- [x] Install prompt, test install

### 14. MVP Testing

- [x] Flow: register -> upload -> preview -> approve -> dashboard -> check
- [x] AI linking: existing supplement linked, new one created
- [x] Stock: check decrements, replenish adds, adjust overwrites
- [x] Mobile Chrome, PWA install
- [x] Loading/error/empty states
- [x] `pl.json`

---

## WEEK 1

### 15. Stock Forecast & Alerts

> PRD → US-15

- [x] `stockWarningThreshold` on Supplement + migration
- [x] Forecast: currentStock / dailyUsage = days
- [x] `features/stock/api/queries/get-low-stock.ts`
- [x] `features/stock/components/stock-list/stock-progress-bar.tsx`
- [x] `features/stock/components/buy-soon/buy-soon-list.tsx` + items + barrel
- [x] `features/dashboard/components/supplement-row/stock-warning-badge.tsx` (Level 1)
- [x] "Buy soon" section, badge on dashboard

### 16. Push Notifications

> PRD → US-16

- [x] VAPID keys, `web-push`, `src/shared/lib/web-push.ts`
- [x] `notifications` table + migration + repo
- [x] `src/app/api/push/subscribe/route.ts` + `send/route.ts`
- [x] `features/notifications/hooks/use-push-subscription.ts` (Level 2)
- [x] SW push events, Dokploy cron every minute

### 17. Notification Settings

- [x] Settings notification-settings component + schema + actions
- [x] Per time block: time picker + toggle

### 18. Weekly View

- [x] `src/app/(app)/(main)/dashboard/weekly/page.tsx`
- [x] `features/dashboard/api/queries/get-weekly-status.ts`
- [x] `features/dashboard/components/weekly-view/` (7-day grid with completion indicators)
- [x] Navigation: switch between daily ↔ weekly

### 19. Monthly View

- [x] `src/app/(app)/(main)/dashboard/monthly/page.tsx`
- [x] `features/dashboard/api/queries/get-monthly-status.ts`
- [x] `features/dashboard/components/monthly-view/` (calendar heatmap)
- [x] Navigation: switch between daily ↔ weekly ↔ monthly

### 20. "Add manually" protocol

> PRD → US-14

- [x] Third option in upload step: form for manually creating a protocol

### 21. WEEK 1 Testing

- [ ] Stock forecast, alerts, progress bars
- [ ] Push mobile, reminder 30 min, toggle per time block
- [ ] Weekly/monthly views
- [ ] Deploy Dokploy

---

## V2

### 22. Skip with reason

### 23. Critical medication reminders

### 24. Animations

### 25. Integration Tests

- [ ] Vitest setup
- [ ] Test: AI parsing -> linking to existing Supplements
- [ ] Test: create-protocol -> Supplement + Schedule records
- [ ] Test: mark-taken -> DailyLog + stock decrement
- [ ] Test: replenish -> stock addition

---

## LATER

### 26. Cost summary

> PRD → US-18. Cost logic → `technical-requirements.md` > Cost logic.

### 27. Purchase forecast

### 28. Offline Queue

### 29. Stock setup in onboarding

### 30. Bulk Delete

### 31. History export
