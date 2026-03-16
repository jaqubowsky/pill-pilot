# Smart Shopping & Cost Feature

## Context

User has 20+ supplements ordered from multiple shops. Wants to know: how much they spend, when to order, and what to order together per shop — minimizing delivery costs. Prices should be easy to enter (inline editing + AI cart screenshot scan). Expenses estimated from actual consumption.

## Key Decisions

- New **"Zakupy" tab** in bottom nav (4 tabs: Dzisiaj | Magazyn | Zakupy | Ustawienia)
- **Remove BuySoonList from Magazyn**
- New **`shops` table**: `id, userId, name, deliveryCost, freeDeliveryThreshold`
- **Keep `brandName`**, add `shopId` (FK to shops) alongside it. No breaking changes to existing 32 files using brandName.
- **Delivery buffer**: constant `DELIVERY_BUFFER_DAYS = 3`
- **One-time supplements**: excluded from shopping list if stock outlasts schedule durations
- **Expense tracking**: estimated from dailyLogs × unit cost
- **Smart grouping per shop**: supplements grouped by shop, system suggests adding items to reach free delivery threshold
- **Cart screenshot**: single-pass Haiku, synchronous. AI extracts shop name → auto-creates/matches shop + sets prices

## Data Model Changes

### New table: `shops`
```
id: text (PK, cuid2)
userId: text (FK → users, NOT NULL)
name: text (NOT NULL)
deliveryCost: decimal(10,2) (nullable) — cost per delivery
freeDeliveryThreshold: decimal(10,2) (nullable) — order total for free delivery
createdAt: timestamp
```

### Modified table: `supplements`
- Keep `brandName` (no changes to existing code)
- Add `shopId: text (FK → shops, nullable)`

---

## Phase 1: DB Migration + Shops + Route + Nav

### Schema & migration

**`src/shared/db/schema.ts`**
- Add `shops` table
- On `supplements`: add `shopId` FK (keep `brandName` as-is)
- Migration: add `shop_id` column + create `shops` table

**`src/shared/repositories/shop-repository.ts`** (new)
- `findByUserId(userId)`: list user's shops
- `findById(id)`: single shop
- `create(data)`: create shop
- `update(id, data)`: update shop
- `delete(id)`: delete shop (set supplements.shopId to null first)

### Route & nav

**`src/app/(app)/(main)/shopping/page.tsx`** (new)
- Auth check → render `ShoppingPage`

**`src/features/shopping/shopping-page.tsx`** (new, RSC)
- Fetch: shopping list + price list + expense data + shops
- Render: `ShoppingList` + `ExpenseSummary` + `PriceList`

**`src/features/shopping/index.ts`** (new)

**`src/app/(app)/(main)/bottom-nav.tsx`** (modify)
- Add 4th tab: Zakupy (ShoppingCart icon)

**`src/shared/i18n/messages/pl.json`** (modify)
- Add `nav.shopping`, `shopping.*`

**`src/features/stock/stock-page.tsx`** (modify)
- Remove BuySoonList + getLowStock

### Supplement form updates

**`src/features/supplements/components/supplement-form/`** (modify)
- Add shop dropdown alongside existing brandName (select from user's shops + "Dodaj sklep")

---

## Phase 2: Shopping List (smart grouping per shop)

### New files

**`src/features/shopping/api/queries/get-shopping-list.ts`**
- Based on `getLowStock` pattern, enhanced:
  - Add `DELIVERY_BUFFER_DAYS` to threshold
  - Filter out one-time supplements (stock outlasts all schedules)
  - Include `packagePrice`, `shopId`, shop details
  - Compute `depletionDate` per item
  - Also fetch supplements NOT yet low but from same shops — for free delivery suggestions
- Return: items grouped by shop, with per-shop subtotal and delivery cost info

**`src/features/shopping/lib/optimize-shopping.ts`**
- Pure function: takes shopping items + shop data → returns optimized orders
- Per shop:
  - Must-buy: items running low (within threshold + delivery buffer)
  - Suggest-add: items from same shop that will run out within ~30 days, IF adding them reaches free delivery threshold
  - Total per shop (items + delivery cost if below threshold)

**`src/features/shopping/components/shopping-list/shopping-list.tsx`** (client)
- Renders per-shop groups
- Each group: shop name, delivery info, items, subtotal, delivery cost
- If below free delivery threshold: "Dorzuć X żeby mieć darmową dostawę" suggestion
- Grand total at bottom

**`src/features/shopping/components/shopping-list/shopping-item.tsx`**
- Name, depletion date, price, urgency styling
- Suggested items styled differently (lighter, with "dorzuć?" label)

**`src/features/shopping/components/shopping-list/index.ts`**

**`src/shared/lib/stock-forecast.ts`** (modify)
- Export `DELIVERY_BUFFER_DAYS = 3`

---

## Phase 3: Price List + Shop Management

### New files

**`src/features/shopping/api/queries/get-price-list.ts`**
- All active supplements: id, name, shop, stockUnit, packagePrice, packageSize
- Joined with shops for shop name

**`src/features/shopping/components/price-list/price-list.tsx`** (client)
- All supplements grouped by shop (null shop = "Bez sklepu")
- Per row: name | [price] zł | [packageSize] szt
- Inline-editable, auto-save on blur
- "Skanuj koszyk" button at top
- Shop management: add/edit shop (name, delivery cost, free threshold)

**`src/features/shopping/components/price-list/use-price-list.ts`**
- Edit state, optimistic updates, debounced save

**`src/features/shopping/components/price-list/index.ts`**

**`src/features/shopping/components/shop-edit-sheet/shop-edit-sheet.tsx`** (client)
- Sheet for adding/editing a shop: name, delivery cost, free delivery threshold
- Used from price list and supplement form

**`src/features/shopping/components/shop-edit-sheet/use-shop-edit-sheet.ts`**

**`src/features/shopping/components/shop-edit-sheet/index.ts`**

**`src/features/shopping/api/actions/update-supplement-prices.ts`**
- Batch update: `{ updates: { supplementId, packagePrice?, packageSize?, shopId? }[] }`

**`src/features/shopping/api/actions/manage-shop.ts`**
- Create/update/delete shop actions

---

## Phase 4: Expense Summary

### New files

**`src/features/shopping/api/queries/get-expense-data.ts`**
- Query dailyLogs (current month + 2 previous)
- Join: dailyLogs → supplementSchedules → supplements (packagePrice, packageSize)
- Cost per log = `(packagePrice / packageSize) * dosageAmount`
- Aggregate by week (current month) and month (previous)
- Return: `{ currentMonth: { weeks: { weekNum, cost }[], total }, previousMonths: { month, total }[] }`

**`src/features/shopping/components/expense-summary/expense-summary.tsx`** (client)
- Current month: weekly breakdown
- Previous months: totals
- Note if many supplements missing prices

**`src/features/shopping/components/expense-summary/index.ts`**

---

## Phase 5: Price at Restock

### Modified files

**`src/features/stock/api/actions/replenish-stock.ts`**
- Add `packagePrice: z.number().positive().optional()` to schema
- If provided → update supplement's packagePrice

**`src/features/stock/components/stock-list/restock-dialog/restock-dialog.tsx`**
- Replace NumberInputDialog with custom Dialog: amount + optional price

**`src/features/stock/components/stock-list/restock-dialog/use-restock-dialog.ts`**
- Add price state

---

## Phase 6: AI Cart Screenshot

### New files

**`src/features/shopping/schemas/cart-parse-schema.ts`**
- `cartItemSchema: { productName, price, quantity, matchedSupplementId?, confidence }`
- `cartParseSchema: { items: cartItemSchema[], shopName? }`

**`src/app/api/cart/parse/route.ts`**
- Auth, rate limit
- FormData: file (image) + supplements (JSON)
- Compress image with sharp
- Single Haiku call → structured output
- Return items + detected shopName

**`src/features/shopping/components/cart-price-sheet/cart-price-sheet.tsx`** (client)
- Sheet after AI parse
- Shop name at top (auto-detected, editable) → creates/matches shop
- List: productName, price, matched supplement (dropdown to change), confidence badge
- **Confidence system** (reuse pattern from protocol preview):
  - High confidence (≥ 0.8): auto-matched, green badge, user can change
  - Low confidence (< 0.8): yellow badge "Zweryfikuj", user must confirm/change match
  - No match (null): red badge "Niedopasowany", user picks from dropdown or skips
  - "Zapisz" blocked until all low-confidence items verified (same UX as protocol approval)
- "Zapisz ceny" → updateSupplementPrices + assign shopId

**`src/features/shopping/components/cart-price-sheet/use-cart-price-sheet.ts`**

**`src/features/shopping/components/cart-price-sheet/index.ts`**

**`src/proxy.ts`** (modify)
- Add `/api/cart/parse` to public paths

---

## Implementation Order

1. **Phase 1** — DB, route, nav (foundation)
2. **Phase 2** — Shopping list with smart grouping (core value)
3. **Phase 3** — Price list + shop management (enables cost data)
4. **Phase 4** — Expense summary
5. **Phase 5** — Price at restock
6. **Phase 6** — AI cart screenshot
7. **Phase 7** — Post-protocol price sheet (reuses Phase 3 PriceList)

## Phase 7: Post-Protocol Price Sheet

After approving a protocol, show a sheet prompting user to set prices/shops for newly added supplements.

### Modified files

**`src/features/protocol-wizard/api/actions/create-protocol.ts`** (modify)
- Return list of newly created supplement IDs in action result (already creates them, just need to return IDs)

**`src/features/protocol-wizard/components/parsed-preview/use-parsed-preview.ts`** (modify)
- On successful approval, open price sheet with new supplement IDs instead of immediately redirecting

**New: `src/features/shopping/components/price-sheet/price-sheet.tsx`** (client)
- Sheet wrapper around `PriceList` component (reuse from Phase 3)
- Props: `supplementIds` (filter), `onClose`, `open`
- Includes "Skanuj koszyk" + "Później" + "Zapisz" buttons
- On close/save → redirect to dashboard

**`src/features/shopping/components/price-sheet/index.ts`**

### Note
- `PriceList` component (Phase 3) accepts optional `filterIds` prop to show only specific supplements
- Same component, two contexts: full list on Zakupy page, filtered in post-protocol sheet

---

## Edge Cases & Notes

- **No prices/shops yet**: empty states on all sections. Shopping list still shows items (without cost). Expense summary shows "Uzupełnij ceny".
- **AI cart scan doesn't know `packageSize`**: cart screenshot has price but not how many pills per package. Price list lets user fill `packageSize` separately. Expense calculation requires BOTH `packagePrice` AND `packageSize` — skip supplements missing either.
- **Supplements without shop**: appear in "Bez sklepu" group. No delivery optimization for them.
- **optimize-shopping "suggest add" logic**: only suggests if adding the item brings total above `freeDeliveryThreshold`. If no threshold set on shop, no suggestions.
- **Restock sets price but NOT shop**: shop is assigned via price list or AI cart scan. These are independent flows.
- **AI protocol parsing unchanged**: protocol wizard still uses `brandName`. Shop/price assignment happens via post-approval sheet (Phase 7) or later on price list.
- **Post-protocol sheet skippable**: user can click "Później" and prices stay empty. Shopping list and expenses degrade gracefully (no cost shown).

## Verification

- `shops` table created, `shopId` added to supplements (brandName kept)
- "Zakupy" tab in bottom nav
- Shopping list grouped by shop, sorted by depletion date
- Free delivery suggestions shown when below threshold
- One-time supplements excluded, delivery buffer applied
- Price list: inline editing of price/packageSize, shop assignment
- Shop management: create/edit with delivery cost + threshold
- Expense summary: weekly + monthly breakdown
- Restock dialog: optional price field
- Cart screenshot: AI extracts items + prices + shop → match → save
- BuySoonList gone from Magazyn
