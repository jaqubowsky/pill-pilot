# PillPilot - Roadmap & Checklist

Related documents:

- `PRD_PillPilot.md` — product requirements, user stories
- `design.md` — design system, components, screen wireframes
- `tech-stack.md` — stack, conventions, folder structure
- `technical-requirements.md` — data model, schemas, business logic

Mark `[x]` when completed.

---

## MVP

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
  - [x] `users` (id, email, name, emailVerified, image, settings, createdAt, updatedAt) — Better Auth managed
  - [x] `sessions`, `accounts`, `verifications` — Better Auth tables
  - [x] `timeBlocks` (id, userId, name, icon, startTime, sortOrder, active, createdAt)
  - [x] `supplements` (id, userId, name, brandName, category, stockUnit, currentStock [decimal], stockWarningThreshold, packageSize, packagePrice, active, createdAt)
  - [x] `protocols` (id, userId, name, parsedData, status: draft|active|archived|processing|failed, startDate, createdAt)
  - [x] `supplementSchedules` (id, protocolId, supplementId, timeBlockId, dosageAmount, dosageUnit, notes, isCritical, cycleDaysOn, cycleDaysOff, startDayOffset, durationDays, dosageIntervalMinutes, waitAfterTakingMinutes, sortOrder, active, createdAt) — direct link: Protocol ↔ Supplement ↔ TimeBlock
  - [x] `dailyLogs` (id, scheduleId, date, takenAt, timerNotifiedAt, timerAdjustmentMinutes, cooldownSkippedAt)
  - [x] `pushSubscriptions` (id, userId, subscriptionJson, createdAt)
  - [x] `notificationSettings` (id, userId, timeBlockId, enabled, notifyAt, lastSentDate, createdAt)
- [x] Migration
- [x] Seed: default TimeBlocks on registration (9 blocks: Na czczo, Śniadanie, 2. śniadanie, Przed obiadem, Obiad, Przed kolacją, Kolacja, Po kolacji, Przed snem)
- [x] Repositories:
  - [x] `src/shared/repositories/time-block-repository.ts`
  - [x] `src/shared/repositories/supplement-repository.ts`
  - [x] `src/shared/repositories/protocol-repository.ts`
  - [x] `src/shared/repositories/supplement-schedule-repository.ts`
  - [x] `src/shared/repositories/daily-log-repository.ts`
  - [x] `src/shared/repositories/notification-repository.ts`

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
  - [x] `supplement-link-badge.tsx`, `confidence-badge.tsx`, `supplement-badges.tsx`
- [x] `features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/` (folder: edit supplement inline)
  - [x] `preview-supplement-sheet.tsx`, `preview-supplement-sheet-fields.tsx`, `preview-supplement-sheet.schema.ts`, `use-preview-supplement-sheet.ts`
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
- [x] `features/protocol-wizard/api/actions/create-draft-protocol.ts` (creates initial draft)
- [x] `features/protocol-wizard/api/actions/delete-draft-protocol.ts` (cleanup)
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
- [x] `features/dashboard/components/daily-view/dashboard-empty-state.tsx`
- [x] `features/dashboard/components/daily-view/active-timers-banner/` (folder: component + hook + timer-row subfolder)
- [x] `features/dashboard/components/daily-view/index.ts`
- [x] `features/dashboard/components/time-block/time-block.tsx`
- [x] `features/dashboard/components/time-block/time-block-header.tsx`
- [x] `features/dashboard/components/time-block/time-block-progress.tsx`
- [x] `features/dashboard/components/time-block/use-time-block.ts`
- [x] `features/dashboard/components/time-block/index.ts`
- [x] `features/dashboard/components/supplement-row/supplement-row.tsx`
- [x] `features/dashboard/components/supplement-row/use-supplement-row.ts` (Level 1)
- [x] `features/dashboard/components/supplement-row/use-check-supplement.ts` (Level 1)
- [x] `features/dashboard/components/supplement-row/supplement-checkbox.tsx`
- [x] `features/dashboard/components/supplement-row/check-icon.tsx`
- [x] `features/dashboard/components/supplement-row/schedule-edit-sheet/` (folder: inline schedule editing from dashboard)
- [x] `shared/components/icon-badge.tsx` (Level 3, supports critical/cycling/timer icons)
- [x] `features/dashboard/components/supplement-row/index.ts`
- [x] `features/dashboard/components/check-all-button/check-all-button.tsx` + `use-check-all.ts` + `index.ts`
- [x] `features/dashboard/components/view-switcher.tsx` (daily/weekly/monthly navigation)
- [x] `features/dashboard/lib/` — shared helpers: `build-schedule-entry.ts`, `cycling.ts`, `dependency.ts`, `format-remaining-time.ts`, `group-by-time-block.ts`, `protocol-colors.ts`

### 8. Checking off

> PRD → US-4. Stock logic → `technical-requirements.md` > Stock logic.

- [x] `features/dashboard/api/actions/mark-taken.ts` (next-safe-action)
  - [x] Creates DailyLog + decrements supplement.currentStock (if != null)
- [x] `features/dashboard/api/actions/mark-untaken.ts` (next-safe-action, deletes DailyLog + increments stock back)
- [x] `features/dashboard/api/actions/mark-block-taken.ts` (next-safe-action)
- [x] `features/dashboard/api/actions/adjust-timer.ts` (timer adjustment)
- [x] `features/dashboard/api/actions/skip-cooldown.ts` (skip wait cooldown)
- [x] `features/dashboard/api/actions/skip-wait-timer.ts` (skip wait timer)
- [x] `features/dashboard/api/actions/update-schedule.ts` (edit schedule from dashboard)
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
- [x] `features/stock/components/stock-list/stock-item/` (folder: component + hook + stock-quantity)
  - [x] Name, brand, stock, [Replenish] [Adjust]
- [x] `features/stock/components/stock-list/adjust-dialog/` (folder: component + hook)
- [x] `features/stock/components/stock-list/restock-dialog/` (folder: component + hook)
- [x] `features/stock/components/stock-list/supplement-edit-sheet/` (folder: component + hook)
- [x] `features/stock/components/stock-list/stock-calculator/` (folder: component + hook — calculates remaining stock from package info)
- [x] `features/stock/components/stock-list/index.ts`
- [x] `features/stock/api/actions/replenish-stock.ts` (ADDS to currentStock)
- [x] `features/stock/api/actions/update-stock.ts` (OVERWRITES currentStock)
- [x] `features/stock/api/actions/calculate-remaining-stock.ts`

### 10. Supplement management

> PRD → US-5, US-6

- [x] `features/supplements/components/supplement-form/supplement-form.tsx`
- [x] `features/supplements/components/supplement-form/supplement-form.schema.ts` (Level 1)
- [x] `features/supplements/components/supplement-form/supplement-fields.tsx`
- [x] `features/supplements/components/supplement-form/use-supplement-fields.ts` (Level 1)
- [x] `features/supplements/components/supplement-form/use-supplement-form.ts` (Level 1)
- [x] `features/supplements/components/supplement-form/index.ts`
- [x] `features/supplements/api/actions/add-supplement.ts` (adds to inventory)
- [x] `features/supplements/api/actions/update-supplement.ts`
- [x] `features/supplements/api/actions/delete-supplement.ts` (soft delete: active → false + cascading schedules.active → false)

### 11. Settings

> PRD → Settings. Archiving → `technical-requirements.md` > Protocol archiving.

- [x] `src/app/(app)/(main)/settings/page.tsx`
- [x] `features/settings/components/settings-page/settings-page.tsx` + sections + barrels
- [x] Protocol section:
  - [x] `protocol-section.tsx` + `use-protocol-section.ts` + `index.ts`
  - [x] `protocol-card/` (folder: component + hook + processing-phrase)
  - [x] List of active protocols with their schedules
  - [x] Per protocol: name, schedule list, "Archive", "Edit", "Delete"
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
  - [x] `features/settings/api/queries/get-user-protocols.ts` (protocols with their schedules)
  - [x] `features/settings/api/queries/get-user-time-blocks.ts`
- [x] Notification section:
  - [x] `features/settings/components/settings-page/notification-section/` (folder: component + hook)
  - [x] Per time block: time picker + toggle
- [x] Account section:
  - [x] `features/settings/components/settings-page/account-section/` (folder: component + hook)
  - [x] Email (read-only), "Sign out"
- [x] `features/settings/api/actions/archive-protocol.ts` (protocol.status → archived, schedules.active → false)
- [x] `features/settings/api/actions/reactivate-protocol.ts` (reverse of archiving)
- [x] `features/settings/api/actions/delete-protocol.ts` (permanent deletion)
- [x] `features/settings/api/actions/update-protocol.ts` (edit protocol name/startDate)
- [x] `features/settings/api/queries/get-protocol-as-parsed.ts` (convert active protocol back to parsed format for editing)
- [x] `features/settings/api/queries/get-notification-settings.ts`

### 12. Navigation

- [x] `src/app/(app)/(main)/layout.tsx` (bottom nav: Today | Stock | Settings)
- [x] `src/app/(app)/(main)/bottom-nav.tsx`
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

### 15. Stock Forecast & Alerts

> PRD → US-15

- [x] `stockWarningThreshold` on Supplement + migration
- [x] Forecast: `shared/lib/stock-forecast.ts` — `forecastDaysInStock()` simulates day-by-day consumption respecting cycling, startDayOffset, durationDays
- [x] `features/stock/api/queries/get-low-stock.ts`
- [x] `features/stock/components/stock-list/stock-progress-bar.tsx`
- [x] `features/stock/components/buy-soon/buy-soon-list.tsx` + `buy-soon-item.tsx` + `index.ts`
- [x] "Buy soon" section on stock page

### 16. Push Notifications

> PRD → US-16

- [x] VAPID keys, `web-push`, `src/shared/lib/web-push.ts`
- [x] `pushSubscriptions` + `notificationSettings` tables + migration + `notification-repository.ts`
- [x] `src/app/api/push/subscribe/route.ts` + `send/route.ts` + `timers/route.ts`
- [x] `features/notifications/hooks/use-push-subscription.ts` (Level 2)
- [x] `features/notifications/api/actions/send-test-notification.ts`
- [x] `features/notifications/api/actions/update-notification-settings.ts`
- [x] SW push events, Dokploy cron every minute

### 17. Notification Settings

- [x] `features/settings/components/settings-page/notification-section/` (component + hook)
- [x] Per time block: time picker + toggle

### 18. Weekly View

- [x] `src/app/(app)/(main)/dashboard/weekly/page.tsx`
- [x] `features/dashboard/api/queries/get-weekly-status.ts`
- [x] `features/dashboard/components/weekly-view/` (weekly-view, week-day-cell, use-weekly-view, index)
- [x] Navigation: switch between daily ↔ weekly via view-switcher

### 19. Monthly View

- [x] `src/app/(app)/(main)/dashboard/monthly/page.tsx`
- [x] `features/dashboard/api/queries/get-monthly-status.ts`
- [x] `features/dashboard/components/monthly-view/` (monthly-view, calendar-day, use-monthly-view, index)
- [x] Navigation: switch between daily ↔ weekly ↔ monthly via view-switcher

### 20. "Add manually" protocol

> PRD → US-14

- [x] `src/app/(app)/(main)/protocol/new/manual/page.tsx`
- [x] `features/protocol-wizard/components/manual-protocol-form/` (folder: component + hook + existing-supplement-picker + supplement-row)
- [x] Third option in upload step: form for manually creating a protocol

### 21. Shared Components (Level 3)

- [x] `shared/components/icon-badge.tsx` — icon badge for critical/cycling/timer indicators
- [x] `shared/components/labeled-input.tsx`, `shared/components/labeled-select.tsx`
- [x] `shared/components/toggle-row.tsx`
- [x] `shared/components/info-hint.tsx`
- [x] `shared/components/truncated-note.tsx`
- [x] `shared/components/supplement-info.tsx`
- [x] `shared/components/back-button.tsx`
- [x] `shared/components/bottom-sheet.tsx`
- [x] `shared/components/number-input-dialog.tsx`
- [x] `shared/components/pill-bottle-icon.tsx`
- [x] `shared/components/time-duration-input/` (folder: component + hook)
- [x] `shared/components/service-worker-registrar.tsx`

### 22. Testing

- [ ] Stock forecast, alerts, progress bars
- [ ] Push mobile, reminder 30 min, toggle per time block
- [ ] Weekly/monthly views
- [ ] Deploy Dokploy

---

## V2

### 23. Skip with reason

### 24. Critical medication reminders

### 25. Animations

### 26. Integration Tests

- [ ] Vitest setup
- [ ] Test: AI parsing -> linking to existing Supplements
- [ ] Test: create-protocol -> Supplement + Schedule records
- [ ] Test: mark-taken -> DailyLog + stock decrement
- [ ] Test: replenish -> stock addition

---

## LATER

### 27. Cost summary

> PRD → US-18. Cost logic → `technical-requirements.md` > Cost logic.

### 28. Purchase forecast

### 29. Offline Queue

### 30. Stock setup in onboarding

### 31. Bulk Delete

### 32. History export
