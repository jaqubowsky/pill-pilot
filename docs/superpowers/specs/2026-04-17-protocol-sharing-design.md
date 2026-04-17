# Protocol Sharing — Design Spec

**Date:** 2026-04-17  
**Status:** Approved

---

## Overview

Add a mechanism allowing a logged-in user to share a protocol via a generated link. The recipient (also logged-in) opens the link, sees an editable import form pre-populated with AI-matched data, and saves it as their own protocol. Missing supplements and time blocks are auto-created.

---

## Requirements

- Share link is permanent until the owner revokes it (one link per protocol at a time)
- Recipient must be logged in to view and import
- AI matches shared supplements against recipient's existing inventory (same pattern as Excel import)
- Time blocks matched by name + startTime (no AI needed)
- Only skeleton data is shared: name, category, stockUnit, dosageAmount, dosageUnit, notes, isCritical, cycling fields, timing fields — no currentStock, packagePrice, packageSize
- Owner can revoke the link; token becomes invalid immediately
- If token is invalid/revoked: recipient sees an error page
- Tests (failing first) for all Server Actions, queries, and services

---

## Data Model

Single schema change — add nullable `shareToken` column to `protocols`:

```typescript
// schema.ts
shareToken: text("share_token").unique(),
```

Semantics:
- `null` → not shared
- non-null → active link at `/share/[shareToken]`
- Revoke = set to `null`
- Token generation: `nanoid(21)` (URL-safe)

One Drizzle migration required.

---

## Routes

```
app/(app)/share/[token]/
  page.tsx      ← Server Component: fetch + AI matching + render ImportProtocolForm
  error.tsx     ← "Link wygasł lub jest nieprawidłowy"
```

Placed inside `(app)` (auth-protected) but outside `(main)` (no bottom nav — focused import view).

---

## User Flow

### Owner (sharing)

1. Protocol card in Settings → "Udostępnij" button (share icon)
2. Click → `generateShareToken` Server Action → saves `nanoid(21)` to `protocols.shareToken`
3. Card shows: link field + "Kopiuj" button + "Unieważnij" button
4. "Unieważnij" → `revokeShareToken` action → `shareToken = null`, UI resets to no-link state

### Recipient (importing)

1. Opens `/share/[token]`
2. Middleware checks auth → if not logged in: redirect to `/login?callbackUrl=/share/[token]`
3. Server Component fetches protocol by token (no `userId` check)
4. Invalid/revoked token → render `error.tsx`
5. Valid token → AI enrichment: shared supplement names vs recipient's existing supplements → confidence-scored matches
6. Renders `ImportProtocolForm` pre-populated with matched data
7. Recipient modifies if needed → "Importuj protokół" submit
8. `importSharedProtocol` Server Action:
   - Creates new supplements for unmatched (name, category, stockUnit only)
   - Reuses existing supplements for AI-matched ones
   - Creates new time blocks for unmatched (match by name + startTime)
   - Reuses existing time blocks for matched ones
   - Creates protocol in recipient's account with `status: "draft"`
9. Redirect to `/settings` (protocol list)

---

## Architecture

### New files

```
features/protocol-wizard/
  api/actions/
    generate-share-token.ts         ← nanoid + update protocols.shareToken
    generate-share-token.test.ts
    revoke-share-token.ts           ← set shareToken = null
    revoke-share-token.test.ts
    import-shared-protocol.ts       ← creates protocol + supplements + time blocks
    import-shared-protocol.test.ts
  api/queries/
    get-shared-protocol.ts          ← fetch by shareToken (no userId check)
    get-shared-protocol.test.ts
  api/services/
    build-share-ai-content.ts       ← adapter: shared supplements → AI enrichment format
    build-share-ai-content.test.ts
  components/
    share-button/                   ← folder (component + hook)
      index.ts
      share-button.tsx
      use-share-button.ts
    import-protocol-form/           ← folder (component + hook)
      index.ts
      import-protocol-form.tsx      ← wraps ProtocolFormBase, calls importSharedProtocol
      use-import-protocol-form.ts
    import-protocol-page.tsx        ← thin page wrapper (receives AI-matched data as props)

app/(app)/share/[token]/
  page.tsx
  error.tsx
```

### Refactor: protocol-form-base

Extract shared form logic from `manual-protocol-form` into a new base:

```
features/protocol-wizard/components/
  protocol-form-base/               ← NEW: all shared form logic
    index.ts
    protocol-form-base.tsx          ← full form UI, accepts onSubmit/initialData/submitLabel/isPending
    use-protocol-form-base.ts       ← combined state: name + supplements (no submit logic)
    use-protocol-name.ts            ← moved from manual-protocol-form/
    use-supplement-sheet.ts         ← moved from manual-protocol-form/
    supplement-row.tsx              ← moved from manual-protocol-form/
  manual-protocol-form/             ← slimmed: only orchestrates base + createDraftProtocol
    index.ts
    manual-protocol-form.tsx
    use-manual-protocol-form.ts
```

`ProtocolFormBase` props:
```typescript
interface ProtocolFormBaseProps {
  supplements: ExistingSupplementSummary[]
  timeBlocks: TimeBlockSummary[]
  initialData?: ProtocolFormData       // pre-population for import
  submitLabel: string
  isPending: boolean
  onSubmit: (data: ProtocolFormData) => void
}
```

No `mode` prop. No ifs. Each use-case owns its submit action.

### Changes to existing files

- `schema.ts` → add `shareToken` column
- `protocol-repository.ts` → add `getByShareToken(token): Protocol | null`
- `settings/components/protocol-section/` → add `ShareButton` to protocol card
- `manual-protocol-form/` → slim down to use `ProtocolFormBase` internally

---

## Shared Data Contract

What gets transferred from owner's protocol to recipient's import form:

| Field | Source |
|---|---|
| Protocol name | `protocols.name` |
| Per schedule: supplement name | `supplements.name` |
| Per schedule: supplement category | `supplements.category` |
| Per schedule: stockUnit | `supplements.stockUnit` |
| Per schedule: dosageAmount, dosageUnit | `supplement_schedules.*` |
| Per schedule: notes, isCritical | `supplement_schedules.*` |
| Per schedule: cycleDaysOn/Off, startDayOffset, durationDays | `supplement_schedules.*` |
| Per schedule: dosageIntervalMinutes, waitAfterTakingMinutes | `supplement_schedules.*` |
| Per schedule: sortOrder, finishPackage | `supplement_schedules.*` |
| Time block: name, icon, startTime | `time_blocks.*` |

**Not shared:** `currentStock`, `packageSize`, `packagePrice`, `shopId`, `brandName`, `startDate` (reset for recipient).

---

## AI Matching

Reuses the existing two-step enrichment pattern from Excel import:

1. `build-share-ai-content.ts` adapts shared protocol supplements into the AI enrichment input format (same shape as `build-ai-content.ts`)
2. AI receives: shared supplement names + recipient's existing supplements (with IDs)
3. AI outputs: matches with confidence score (same schema as `parsed-protocol-schema.ts`)
4. High-confidence matches → reuse existing supplement ID
5. Low-confidence / no match → mark as "new", create on import

Time blocks: matched locally by `name.toLowerCase() + startTime` — no AI call needed.

---

## Tests (failing-first)

### `generate-share-token.test.ts`
- Generates and saves token to `protocols.shareToken`
- Returns the generated token
- Only owner can generate (other userId → unauthorized error)
- Calling again overwrites existing token

### `revoke-share-token.test.ts`
- Sets `shareToken` to `null`
- Only owner can revoke
- Revoking already-null token is a no-op (no error)

### `get-shared-protocol.test.ts`
- Returns protocol data when token is valid
- Returns `null` when token does not exist
- Returns `null` when `shareToken` is `null` (revoked)
- Does NOT require matching `userId`

### `build-share-ai-content.test.ts`
- Outputs correct AI enrichment format for given shared supplements
- Handles empty supplement list

### `import-shared-protocol.test.ts`
- Creates new supplement when AI returns no match
- Reuses existing supplement ID when AI returns high-confidence match
- Creates new time block when no match by name+startTime
- Reuses existing time block ID when match found
- Creates protocol with recipient's `userId` (not the owner's)
- Protocol created with `status: "draft"`
- Throws error when `shareToken` is invalid/revoked
- Throws error when recipient is not authenticated

---

## Error States

| Scenario | Behavior |
|---|---|
| Token not found | `error.tsx`: "Link wygasł lub jest nieprawidłowy" |
| Token revoked | Same as above |
| Recipient not logged in | Redirect to `/login?callbackUrl=/share/[token]` |
| Import Server Action fails | Toast error, form stays open |
