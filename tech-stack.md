# PillPilot - Tech Stack & Architecture

Related documents:
- `PRD_PillPilot.md` — product requirements, user stories
- `design.md` — design system, components, screen wireframes
- `technical-requirements.md` — data model, schemas, business logic
- `ROADMAP.md` — implementation checklist

## Stack

- **Framework:** Next.js 16 (App Router, Server Actions, Cache Components)
- **Database:** PostgreSQL (self-hosted, Docker) + Drizzle ORM
- **DB Abstraction:** Repository pattern - interface + implementation co-located per file
- **Auth:** Better Auth (Google OAuth)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Forms:** react-hook-form + zod
- **Server Actions:** next-safe-action
- **i18n:** next-intl with useTranslations() - single locale (pl)
- **AI:** Vercel AI SDK (ai) with Anthropic provider — two-step parsing (extraction via Haiku, enrichment via Sonnet)
- **File parsing:** exceljs (Excel), mammoth (DOCX), sharp (image compression)
- **PWA:** Service Worker + static asset cache + web-push notifications
- **Deployment:** Hetzner VPS + Dokploy (Docker)

## Conventions

### Zero comments in code

### File naming: kebab-case, self-documenting

### Co-location: THREE levels

**Level 1 - Component-local:** Used by ONE component? Next to it.
**Level 2 - Feature-shared:** Used by 2+ components in feature? Feature api/, schemas/, hooks/, lib/.
**Level 3 - App-shared:** Used by 2+ features? shared/.

Start Level 1. Promote only when second consumer appears.

### Feature structure

    features/
      dashboard/
        api/
          actions/
          queries/
        components/
          daily-view/
            daily-view.tsx
            use-daily-view.ts     # Level 1 — lives under daily-view because it's a child file
            date-navigator/       # Component + hook → folder with barrel
              date-navigator.tsx
              use-date-navigator.ts
              index.ts
        lib/                      # Feature-shared utilities

### Data model: Supplement (inventory) + SupplementSchedule (protocol link)

Full schema with field types → `technical-requirements.md` > Data Model.

    Supplement = user's inventory item (a box in the cabinet)
      - Lives on User, NOT on Protocol
      - One per product (NAC = one Supplement regardless of protocols)
      - Owns stock (currentStock), stockUnit
      - Optional: packageSize, packagePrice (for cost calculation)
      - stockWarningThreshold for low-stock alerts

    SupplementSchedule = the core join table: links Protocol ↔ Supplement ↔ TimeBlock
      - "NAC 2 caps morning" + "NAC 2 caps evening" = two schedules, one supplement
      - Holds ALL per-schedule fields: dosageAmount, dosageUnit, notes, isCritical,
        cycleDaysOn/Off, startDayOffset, durationDays, dosageIntervalMinutes,
        waitAfterTakingMinutes, sortOrder, active

    DailyLog = check mark (per schedule per day)
      - timerNotifiedAt, timerAdjustmentMinutes, cooldownSkippedAt for timer tracking

    Stock decrementation: supplement.currentStock -= schedule.dosageAmount (currentStock is decimal)
    Daily usage: SUM(schedule.dosageAmount) all active schedules per supplement

    There is NO ProtocolSupplement table — SupplementSchedule is the direct link.

### AI linking to inventory

When parsing new protocol, AI receives full user context: existing Supplements (id + name) and TimeBlocks (id + name). AI links schedule entries to existing inventory and time blocks by ID. Creates new Supplements for unknown items. Confidence 0-1. Output schema → `technical-requirements.md` > AI Parsing.

Two-step process: raw extraction (Haiku) → structured enrichment (Sonnet). Supports PDF, Excel, DOCX, images (with sharp compression), and plain text. Uses `after()` for background processing — protocol status goes through processing → draft/failed.

### Tracking: no auto-skip

### Repository pattern
Interface + implementation in one file. No global types.

### index.ts only as barrel re-exports

### Server Actions via next-safe-action

### Server Actions vs Cache Components vs API Routes
- Mutations = Server Actions via next-safe-action (features/*/api/actions/)
- Reads = Cache Components in RSC (features/*/api/queries/)
- External = API Routes (app/api/)

### Dosage units

    capsule, tablet, ml, drops, g, mg, scoop, sachet, spray, portion

### AI parsing
Vercel AI SDK generateText() + Output.object() with zod schema. Available when adding a new protocol from Settings. Confidence float 0-1, threshold in code. Two-step: extraction → enrichment.

### Component folder convention

A component gets its own folder when it has child files (hook, sub-components, schema). The rule works both ways:

- **Single `.tsx` file → stays flat.** Never wrap it in a folder with a barrel.
- **Component + hook (or other child files) → MUST be in a folder** named after the component, with an `index.ts` barrel exporting only the public component.

Example — `stock-list/` has sub-components with hooks, each gets a subfolder:

    stock-list/
      adjust-dialog/
        adjust-dialog.tsx
        use-adjust-dialog.ts
        index.ts
      restock-dialog/
        restock-dialog.tsx
        use-restock-dialog.ts
        index.ts
      stock-calculator/
        stock-calculator.tsx
        use-stock-calculator.ts
        index.ts
      stock-item/
        stock-item.tsx
        stock-quantity.tsx
        use-stock-item.ts
        index.ts
      supplement-edit-sheet/
        supplement-edit-sheet.tsx
        use-supplement-edit-sheet.ts
        index.ts
      stock-list.tsx            ← root component, no hook → stays flat
      use-stock-list.ts
      stock-progress-bar.tsx
      index.ts                  ← exports only StockListView

### Feature public API

Each feature has a root `index.ts` that exports only its page-level component(s). App routes import from the barrel (`@/features/dashboard`), not deep paths. Data fetching lives inside the feature's RSC wrapper — app routes only do auth + render.

Exceptions (the 1%):
- **Cross-feature schemas:** `protocol-wizard` exports `parsedProtocolSchema`, `rawExtractionSchema`, `CONFIDENCE_THRESHOLD` (consumed by `app/api/protocol/parse/`)
- **Cross-feature reuse:** `supplements` exports `SupplementForm`, CRUD actions (`addSupplement`, `deleteSupplement`, `updateSupplement`), and `SupplementFormValues` type (consumed by `stock`)

## Folder Structure

    src/
      app/
        (auth)/
          login/
            page.tsx
        (app)/
          (main)/                            # Bottom nav layout
            dashboard/
              page.tsx
              weekly/
                page.tsx
              monthly/
                page.tsx
            stock/
              page.tsx
            settings/
              page.tsx
            protocol/
              new/
                page.tsx                     # Upload UI
                preview/
                  page.tsx                   # Preview without protocol ID
                  [id]/
                    page.tsx                 # Preview with protocol ID
                manual/
                  page.tsx                   # Manual protocol form
              edit/
                [id]/
                  page.tsx                   # Edit existing protocol
            layout.tsx                       # Bottom nav: Today | Stock | Settings
          layout.tsx                         # Auth guard
        api/
          auth/
            [...all]/
              route.ts
          push/
            subscribe/
              route.ts
            send/
              route.ts
            timers/
              route.ts
          protocol/
            parse/
              route.ts
        error.tsx
        not-found.tsx
        page.tsx                             # Root redirect
        layout.tsx
        manifest.ts
        robots.ts
        sitemap.ts

      features/
        auth/
          components/
            login-page/
              login-page.tsx
              use-login.ts
              google-icon.tsx
              index.ts
          index.ts

        dashboard/
          api/
            actions/
              mark-taken.ts
              mark-untaken.ts
              mark-block-taken.ts
              update-schedule.ts
              adjust-timer.ts
              skip-cooldown.ts
              skip-wait-timer.ts
            queries/
              get-daily-status.ts
              get-weekly-status.ts
              get-monthly-status.ts
          components/
            daily-view/
              daily-view.tsx
              use-daily-view.ts
              dashboard-empty-state.tsx
              active-timers-banner/
                active-timers-banner.tsx
                use-active-timers-banner.ts
                timer-row/
                  timer-row.tsx
                  use-timer-row.ts
                  index.ts
                index.ts
              date-navigator/
                date-navigator.tsx
                use-date-navigator.ts
                index.ts
              progress-ring/
                progress-ring.tsx
                use-progress-ring.ts
                progress-ring-icon.tsx
                index.ts
              index.ts
            weekly-view/
              weekly-view.tsx
              use-weekly-view.ts
              week-day-cell.tsx
              index.ts
            monthly-view/
              monthly-view.tsx
              use-monthly-view.ts
              calendar-day.tsx
              index.ts
            time-block/
              time-block.tsx
              time-block-header.tsx
              time-block-progress.tsx
              use-time-block.ts
              index.ts
            supplement-row/
              supplement-row.tsx
              use-supplement-row.ts
              use-check-supplement.ts
              supplement-checkbox.tsx
              check-icon.tsx
              schedule-edit-sheet/
                schedule-edit-sheet.tsx
                use-schedule-edit-sheet.ts
                index.ts
              index.ts
            check-all-button/
              check-all-button.tsx
              use-check-all.ts
              index.ts
            view-switcher.tsx
          lib/
            build-schedule-entry.ts
            cycling.ts
            dependency.ts
            format-remaining-time.ts
            group-by-time-block.ts
            protocol-colors.ts
          dashboard-page.tsx
          weekly-dashboard-page.tsx
          monthly-dashboard-page.tsx
          index.ts

        protocol-wizard/
          api/
            actions/
              create-protocol.ts
              create-draft-protocol.ts
              save-draft-protocol.ts
              delete-draft-protocol.ts
            queries/
              get-protocol-for-preview.ts
          components/
            upload-step/
              upload-step.tsx
              use-upload-step.ts
              use-parse-protocol.ts
              file-dropzone/
                file-dropzone.tsx
                use-file-dropzone.ts
                index.ts
              index.ts
            parsed-preview/
              parsed-preview.tsx
              use-parsed-preview.ts
              parsed-preview.schema.ts
              preview-block.tsx
              preview-supplement-row/
                preview-supplement-row.tsx
                confidence-badge.tsx
                supplement-link-badge.tsx
                supplement-badges.tsx
                index.ts
              preview-supplement-sheet/
                preview-supplement-sheet.tsx
                preview-supplement-sheet-fields.tsx
                preview-supplement-sheet.schema.ts
                use-preview-supplement-sheet.ts
                index.ts
              index.ts
            manual-protocol-form/
              manual-protocol-form.tsx
              use-manual-protocol-form.ts
              existing-supplement-picker.tsx
              supplement-row.tsx
              index.ts
          schemas/
            parsed-protocol-schema.ts
          types.ts
          protocol-upload-page.tsx
          protocol-preview-page.tsx
          protocol-edit-page.tsx
          protocol-manual-page.tsx
          index.ts

        stock/
          api/
            actions/
              update-stock.ts
              replenish-stock.ts
              calculate-remaining-stock.ts
            queries/
              get-stock-list.ts
              get-low-stock.ts
          components/
            stock-list/
              stock-list.tsx
              use-stock-list.ts
              stock-progress-bar.tsx
              stock-item/
                stock-item.tsx
                stock-quantity.tsx
                use-stock-item.ts
                index.ts
              adjust-dialog/
                adjust-dialog.tsx
                use-adjust-dialog.ts
                index.ts
              restock-dialog/
                restock-dialog.tsx
                use-restock-dialog.ts
                index.ts
              stock-calculator/
                stock-calculator.tsx
                use-stock-calculator.ts
                index.ts
              supplement-edit-sheet/
                supplement-edit-sheet.tsx
                use-supplement-edit-sheet.ts
                index.ts
              index.ts
            buy-soon/
              buy-soon-list.tsx
              buy-soon-item.tsx
              index.ts
          stock-page.tsx
          index.ts

        supplements/
          api/
            actions/
              add-supplement.ts
              update-supplement.ts
              delete-supplement.ts
          components/
            supplement-form/
              supplement-form.tsx
              supplement-form.schema.ts
              use-supplement-form.ts
              use-supplement-fields.ts
              supplement-fields.tsx
              index.ts
          index.ts

        notifications/
          api/
            actions/
              update-notification-settings.ts
              send-test-notification.ts
          hooks/
            use-push-subscription.ts

        settings/
          api/
            actions/
              archive-protocol.ts
              reactivate-protocol.ts
              delete-protocol.ts
              update-protocol.ts
              add-time-block.ts
              update-time-block.ts
              delete-time-block.ts
            queries/
              get-user-protocols.ts
              get-user-time-blocks.ts
              get-notification-settings.ts
              get-protocol-as-parsed.ts
          components/
            settings-page/
              settings-page.tsx
              index.ts
              protocol-section/
                protocol-section.tsx
                use-protocol-section.ts
                protocol-card/
                  protocol-card.tsx
                  use-protocol-card.ts
                  processing-phrase.tsx
                  index.ts
                index.ts
              time-blocks-section/
                time-blocks-section.tsx
                use-time-blocks-section.ts
                time-block-row/
                  time-block-row.tsx
                  use-time-block-row.ts
                  index.ts
                time-block-edit-sheet/
                  time-block-edit-sheet.tsx
                  use-time-block-edit-sheet.ts
                  index.ts
                icon-picker.tsx
                index.ts
              notification-section/
                notification-section.tsx
                use-notification-section.ts
                index.ts
              account-section/
                account-section.tsx
                use-account-section.ts
                index.ts
          settings-page-wrapper.tsx
          index.ts

      shared/
        components/
          ui/                                # shadcn/ui primitives (base-ui based)
            alert-dialog.tsx
            badge.tsx
            button.tsx
            dialog.tsx
            input.tsx
            label.tsx
            popover.tsx
            select.tsx
            separator.tsx
            sheet.tsx
            switch.tsx
          back-button.tsx
          bottom-sheet.tsx
          icon-badge.tsx
          info-hint.tsx
          labeled-input.tsx
          labeled-select.tsx
          number-input-dialog.tsx
          pill-bottle-icon.tsx
          service-worker-registrar.tsx
          supplement-info.tsx
          time-duration-input/
            time-duration-input.tsx
            use-time-duration-input.ts
            index.ts
          toggle-row.tsx
          truncated-note.tsx
        db/
          schema.ts
          client.ts
          migrations/
        repositories/
          time-block-repository.ts
          protocol-repository.ts
          supplement-repository.ts
          supplement-schedule-repository.ts
          daily-log-repository.ts
          notification-repository.ts
        lib/
          auth.ts
          auth-client.ts
          ai.ts
          safe-action.ts
          date.ts
          format.ts
          format-minutes.ts
          stock-forecast.ts
          time-block-icons.ts
          utils.ts
          web-push.ts
        i18n/
          messages/
            pl.json
          config.ts
          request.ts

      instrumentation-client.ts
      proxy.ts

## Dependencies

    next ^16.1.6, react ^19.2.4, react-dom ^19.2.4,
    pg, drizzle-orm, drizzle-kit (dev), better-auth,
    next-safe-action, ai, @ai-sdk/anthropic, next-intl, react-hook-form,
    @hookform/resolvers, zod, tailwindcss ^4.2.1, @base-ui/react,
    @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/modifiers + @dnd-kit/utilities,
    class-variance-authority, clsx, tailwind-merge, lucide-react,
    sonner, exceljs, mammoth, sharp, tw-animate-css,
    @paralleldrive/cuid2, shadcn, web-push,
    @biomejs/biome (dev), postcss (dev), @tailwindcss/postcss (dev),
    typescript (dev)

## Environment Variables

    DATABASE_URL,
    BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL,
    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
