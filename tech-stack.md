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
- **AI:** Vercel AI SDK (ai) with Anthropic provider
- **PWA:** Service Worker + static asset cache (offline queue → WEEK 1, push → WEEK 1)
- **Deployment:** Hetzner VPS + Dokploy (Docker)

## Conventions

### Zero comments in code

### File naming: kebab-case, self-documenting

### Co-location: THREE levels

**Level 1 - Component-local:** Used by ONE component? Next to it.
**Level 2 - Feature-shared:** Used by 2+ components in feature? Feature api/, schemas/, hooks/.
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

### Data model: Supplement (inventory) + Schedule (protocol)

Full schema with field types → `technical-requirements.md` > Data Model.

    Supplement = user's inventory item (a box in the cabinet)
      - Lives on User, NOT on Protocol
      - One per product (NAC = one Supplement regardless of protocols)
      - Owns stock (currentStock)
      - Optional: packageSize, packagePrice (for cost calculation)

    ProtocolSupplement = link between Protocol and Supplement
      - Holds notes, cycling config (cycleStartDate, cycleDaysOn, cycleDaysOff), sortOrder, active
      - unique: (protocolId, supplementId)

    SupplementSchedule = when and how much (per protocol supplement)
      - Links ProtocolSupplement <-> TimeBlock
      - "NAC 2 caps morning" + "NAC 2 caps evening" = two schedules, one protocolSupplement, one supplement

    DailyLog = check mark (per schedule per day)

    Stock decrementation: supplement.currentStock -= schedule.dosageAmount (currentStock is decimal)
    Daily usage: SUM(schedule.dosageAmount) all active schedules per supplement

### AI linking to inventory

When parsing new protocol, AI receives full user context: existing Supplements (id + name + brand) and TimeBlocks (id + name + startTime). AI links schedule entries to existing inventory and time blocks by ID. Creates new Supplements for unknown items. Confidence 0-1. Output schema → `technical-requirements.md` > AI Parsing.

### Onboarding state machine

    upload -> preview -> complete

Persisted in user.onboardingStep. Parsed data in protocol.parsedData (status: draft).

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
Vercel AI SDK generateObject() with zod schema. Available in onboarding + adding new protocol. Confidence float 0-1, threshold in code.

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
      stock-item/
        stock-item.tsx
        use-stock-item.ts
        index.ts
      stock-list.tsx            ← root component, no hook → stays flat
      index.ts                  ← exports only StockListView

### Feature public API

Each feature has a root `index.ts` that exports only its page-level component. App routes import from the barrel (`@/features/dashboard`), not deep paths. Data fetching lives inside the feature's RSC wrapper — app routes only do auth + render.

Exceptions (the 1%):
- **Cross-feature reuse:** `onboarding` exports `UploadStep` + `ParsedPreview` (used by both `onboarding/` and `protocol/new/`)
- **Cross-feature actions:** `supplements` exports CRUD actions + form types (consumed by `stock`)
- **API route schemas:** `onboarding` exports `parsedProtocolSchema` (consumed by `app/api/protocol/parse/`)

## Folder Structure

    src/
      app/
        (auth)/
          login/
            page.tsx
        (app)/
          onboarding/
            page.tsx                         # step=upload → upload UI, step=preview → redirect
            preview/
              page.tsx
            stock-setup/                     # [WEEK 1]
              page.tsx
            notifications/                   # [WEEK 1]
              page.tsx
          (main)/                            # Bottom nav layout
            dashboard/
              page.tsx
            stock/
              page.tsx
            settings/
              page.tsx
            protocol/
              new/
                page.tsx                     # reuse onboarding components, for existing users
                preview/
                  page.tsx
            layout.tsx                       # Bottom nav: Today | Stock | Settings
          layout.tsx                         # Auth guard
        api/
          auth/
            [...all]/
              route.ts
          push/                              # [WEEK 1]
            subscribe/
              route.ts
            send/
              route.ts
          protocol/
            parse/
              route.ts
        layout.tsx
        manifest.ts

      features/
        auth/
          components/
            login-page/
              login-page.tsx
              use-login.ts
              index.ts
          index.ts

        dashboard/
          api/
            actions/
              mark-taken.ts
              mark-untaken.ts
              mark-block-taken.ts
              get-daily-status-action.ts
            queries/
              get-daily-status.ts
          components/
            daily-view/
              daily-view.tsx
              use-daily-view.ts
              dashboard-empty-state.tsx
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
              stock-warning-badge.tsx         # [WEEK 1]
              index.ts
            check-all-button/
              check-all-button.tsx
              use-check-all.ts
              index.ts
          lib/
            cycling.ts
          index.ts

        onboarding/
          api/
            actions/
              create-protocol.ts
              save-draft-protocol.ts
            queries/
              get-draft-protocol.ts
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
                index.ts
              preview-supplement-sheet/
                preview-supplement-sheet.tsx
                preview-supplement-sheet-fields.tsx
                preview-supplement-sheet.schema.ts
                use-preview-supplement-sheet.ts
                index.ts
              index.ts
            stock-setup/                     # [WEEK 1]
              stock-setup.tsx
              stock-input-row.tsx
              index.ts
            notification-setup/              # [WEEK 1]
              notification-setup.tsx
              notification-setup.schema.ts
              block-time-row.tsx
              index.ts
          schemas/
            parsed-protocol-schema.ts
          types.ts
          index.ts

        stock/
          api/
            actions/
              update-stock.ts
              replenish-stock.ts
            queries/
              get-stock-list.ts
              get-low-stock.ts               # [WEEK 1]
              get-monthly-cost.ts            # [V2]
          components/
            stock-list/
              stock-list.tsx
              use-stock-list.ts
              stock-item/
                stock-item.tsx
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
              supplement-edit-sheet/
                supplement-edit-sheet.tsx
                use-supplement-edit-sheet.ts
                index.ts
              stock-progress-bar.tsx          # [WEEK 1]
              index.ts
            buy-soon/                        # [WEEK 1]
              buy-soon-list.tsx
              buy-soon-item.tsx
              index.ts
            cost-summary/                    # [V2]
              cost-summary.tsx
              cost-per-supplement.tsx
              index.ts
          index.ts

        supplements/
          api/
            actions/
              add-supplement.ts
              add-schedule.ts
              update-supplement.ts
              update-schedule.ts
              toggle-schedule.ts
              delete-supplement.ts
              bulk-delete-supplements.ts      # [WEEK 1]
            queries/
              get-user-supplements.ts
          components/
            supplement-form/
              supplement-form.tsx
              supplement-form.schema.ts
              use-supplement-form.ts
              use-supplement-fields.ts
              index.ts
            schedule-form/
              schedule-form.tsx
              schedule-form.schema.ts
              use-schedule-form.ts
              use-schedule-fields.ts
              index.ts
          index.ts

        notifications/                       # [WEEK 1]
          api/
            actions/
              update-notification-settings.ts
          components/
            notification-settings/
              notification-settings.tsx
              use-notification-settings.ts
              notification-settings.schema.ts
              block-notification-toggle.tsx
              time-picker-row.tsx
              index.ts
          hooks/
            use-push-subscription.ts

        settings/
          api/
            actions/
              archive-protocol.ts
              reactivate-protocol.ts
              set-protocol-status.ts
              add-time-block.ts
              update-time-block.ts
              delete-time-block.ts
              reorder-time-blocks.ts
            queries/
              get-user-protocols.ts
              get-user-time-blocks.ts
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
                  index.ts
                schedule-edit-sheet/
                  schedule-edit-sheet.tsx
                  use-schedule-edit-sheet.ts
                  index.ts
                add-dose-sheet/
                  add-dose-sheet.tsx
                  use-add-dose-sheet.ts
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
              notification-section/              # [WEEK 1]
                notification-section.tsx
                index.ts
              account-section/
                account-section.tsx
                use-account-section.ts
                index.ts
          index.ts

      shared/
        components/
          ui/                                # shadcn/ui primitives
          bottom-sheet.tsx
          critical-badge.tsx
          labeled-input.tsx
          labeled-select.tsx
          number-input-dialog.tsx
          service-worker-registrar.tsx
          toggle-row.tsx
        db/
          schema.ts
          client.ts
          migrations/
        repositories/
          time-block-repository.ts
          protocol-repository.ts
          protocol-supplement-repository.ts
          supplement-repository.ts
          supplement-schedule-repository.ts
          user-repository.ts
          daily-log-repository.ts
          notification-repository.ts         # [WEEK 1]
        lib/
          auth.ts
          auth-client.ts
          ai.ts
          safe-action.ts
          format.ts
          time-block-icons.ts
          utils.ts
          offline-queue.ts                   # [WEEK 1]
          web-push.ts                        # [WEEK 1]
        hooks/
          use-current-user.ts
          use-offline-sync.ts                # [WEEK 1]
        i18n/
          messages/
            pl.json
          config.ts
          request.ts

## Dependencies

    next ^16.0.0, pg, drizzle-orm, drizzle-kit (dev), better-auth,
    next-safe-action, ai, @ai-sdk/anthropic, next-intl, react-hook-form,
    @hookform/resolvers, zod, tailwindcss ^4.0.0, @base-ui/react,
    @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/modifiers + @dnd-kit/utilities,
    class-variance-authority, clsx, tailwind-merge, lucide-react,
    sonner, next-themes, xlsx, @paralleldrive/cuid2, shadcn,
    @biomejs/biome (dev)
    idb [WEEK 1], web-push [WEEK 1]

## Environment Variables

    DATABASE_URL,
    BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL,
    VAPID_PUBLIC_KEY [WEEK 1], VAPID_PRIVATE_KEY [WEEK 1], VAPID_EMAIL [WEEK 1]
