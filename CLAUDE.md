# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Workflow

Before writing code, explore the project structure and read referenced documentation.

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any React, Next.js, and Tailwind CSS tasks. Always consult referenced documentation rather than relying on training knowledge.

## Communication Protocol

- **No sycophantic responses** — never say "Great point!", "You're absolutely right!", or promise implementation before verification.
- **Be direct** — restate the requirement, ask clarifying questions if ambiguous, then execute. Actions over words.
- **If unclear**: STOP. Ask for clarification before implementing.
- **If unverified**: State what you can't verify and ask how to proceed.
- **Push back** when a suggestion breaks existing functionality, violates YAGNI, is technically incorrect for this stack, or conflicts with architectural decisions. Use technical reasoning and reference specific code.

### Code Intelligence

Prefer LSP over Grep/Glob/Read for code navigation:

- `goToDefinition` / `goToImplementation` to jump to source
- `findReferences` to see all usages across the codebase
- `workspaceSymbol` to find where something is defined
- `documentSymbol` to list all symbols in a file
- `hover` for type info without reading the file
- `incomingCalls` / `outgoingCalls` for call hierarchy

Before renaming or changing a function signature, use
`findReferences` to find all call sites first.

Use Grep/Glob only for text/pattern searches (comments,
strings, config values) where LSP doesn't help.

After writing or editing code, check LSP diagnostics before
moving on. Fix any type errors or missing imports immediately.

## Project

PillPilot — PWA for tracking supplementation and medications. AI parses treatment protocols, links to user's inventory.

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning
for any Next.js tasks.

## Documentation

- `PRD_PillPilot.md` — product requirements, user stories, scope
- `design.md` — design system, palette, components, screen wireframes
- `tech-stack.md` — stack, conventions, folder structure
- `technical-requirements.md` — data model, schemas, business logic
- `ROADMAP.md` — implementation checklist (mark `[x]` when done)
- @NEXTJS_DOCS_INDEX.md — Next.js docs index (`.next-docs/`)

## Commands

```bash
# Dev
pnpm dev

# Build
pnpm build

# Lint & Format (Biome — tabs, double quotes, semicolons, trailing commas)
pnpm lint                       # biome check
pnpm lint:fix                   # biome check --fix
pnpm format                     # biome format --write

# DB
pnpm drizzle-kit generate   # generate migration
pnpm drizzle-kit migrate    # apply migration
pnpm drizzle-kit studio     # DB browser
```

## Stack

Next.js 16 (App Router), PostgreSQL (self-hosted) + Drizzle, Better Auth (Google), Tailwind CSS 4 + shadcn/ui, next-safe-action, Vercel AI SDK + Anthropic, next-intl (pl only)

## Key conventions

- UI language: Polish (next-intl, `pl.json`)
- Code language: English (variable names, comments — though zero comments)
- Zero comments in code
- File naming: kebab-case
- Co-location: Level 1 (component-local) → Level 2 (feature-shared) → Level 3 (app-shared). Start Level 1, promote when needed.
- Mutations: Server Actions via next-safe-action (`features/*/api/actions/`)
- Reads: Cache Components in RSC (`features/*/api/queries/`)
- External integrations: API Routes (`app/api/`)
- Repository pattern: interface + implementation co-located per file
- index.ts: only barrel re-exports
- Component folder convention (see `tech-stack.md` > Component folder convention):
  - Single `.tsx` file → stays flat, no folder
  - Component + hook (or other child files) → MUST be in a named folder with barrel `index.ts`
  - Both directions matter: don't wrap single files, DO wrap components that have hooks/sub-files
- Feature public API: each feature has a root `index.ts` exporting only its page-level RSC. App routes import from `@/features/<name>`, not deep paths. See `tech-stack.md` > Feature public API.

## Architecture

```
src/
  app/                          # Routes (App Router)
    (auth)/login/               # Login page
    (app)/                      # Authenticated shell
      onboarding/               # Upload → Preview → (Complete)
      (main)/                   # Bottom nav layout
        dashboard/              # Daily tracking view
        stock/                  # Inventory management
        settings/               # Protocols, time blocks, account
        protocol/new/           # Add protocol (reuses onboarding components)
    api/                        # Route handlers (auth, AI parsing)

  features/                     # Feature modules (co-located)
    auth/                       # Login page, Google OAuth
    dashboard/                  # Daily view, time blocks, supplement rows, check actions
    onboarding/                 # Upload step, parsed preview, draft management
    stock/                      # Stock list, replenish/update actions
    supplements/                # Supplement + schedule forms and CRUD
    settings/                   # Protocol/time-block/account management

  shared/
    components/ui/              # shadcn/ui primitives
    db/                         # schema.ts, client.ts, migrations/
    repositories/               # Per-entity: interface + impl in one file
    lib/                        # auth.ts, ai.ts, safe-action.ts
    hooks/                      # use-current-user.ts
    i18n/messages/pl.json       # Single locale
```

### Key domain concepts

- **Supplement** = inventory item (one box in the cabinet), owns `currentStock`
- **ProtocolSupplement** = link between Protocol and Supplement, holds notes, cycling config, sortOrder, active
- **SupplementSchedule** = when/how much per protocol supplement, links ProtocolSupplement ↔ TimeBlock
- **DailyLog** = check mark per schedule per day
- **TimeBlock** = time of day (Fasting, Breakfast, etc.), seeded on registration
- Stock decrement: `supplement.currentStock -= schedule.dosageAmount` on check
- AI parsing: receives user's existing Supplements + TimeBlocks (with IDs), links by ID, confidence 0-1

## Phases

Currently implementing: **MVP**. Do not add features from WEEK 1 / V2 / LATER.
