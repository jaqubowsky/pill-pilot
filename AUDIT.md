# PillPilot — Audit Report

Zweryfikowany audit przed upublicznieniem repo. Każdy finding potwierdzony przez przegląd kodu.

---

## CRITICAL

### 1. `<Toaster />` z sonner nigdy nie zamontowany

~15 miejsc z `toast.error()` / `toast.success()`, ale `<Toaster />` nie jest renderowany nigdzie w drzewie komponentów. Żaden toast nie działa.

- **Fix**: Dodaj `<Toaster />` do `src/app/layout.tsx`

### 2. Malformed CSS — view transition suppression dla sheetów nie działa

`src/app/globals.css:226-236` — selektory `::view-transition-old/new(sheet-overlay)` wlewają się w `html:has(...)` jako jeden selector list bez zamykającego `}`. Otwieranie sheeta podczas nawigacji powoduje miganie backdropu.

- **Fix**: Rozdziel na dwa osobne bloki CSS

### 3. `adjustTimer` i `skipWaitTimer` — brak ownership checka na `logId`

- `src/features/dashboard/api/actions/adjust-timer.ts:18` — `where(eq(dailyLogs.id, logId))` bez sprawdzenia userId
- `src/features/dashboard/api/actions/skip-wait-timer.ts:17` — identycznie

Dowolny zalogowany user może modyfikować daily logi innego usera znając `logId`.

- **Fix**: JOIN `dailyLogs → supplementSchedules → protocols` i filtruj po `protocols.userId`

### 4. `CRON_SECRET` undefined = otwarte endpointy push

- `src/app/api/push/send/route.ts:16`
- `src/app/api/push/timers/route.ts:14`

Jeśli env var nie jest ustawiony: `"Bearer undefined"` przechodzi auth.

- **Fix**: Guard na starcie — `if (!process.env.CRON_SECRET) throw new Error(...)`

### 5. `skipCooldown` — ownership check nie jest zweryfikowany

`src/features/dashboard/api/actions/skip-cooldown.ts:19-22` — query po `protocols` zwraca wynik który nigdy nie jest sprawdzony. Jeśli protokół nie należy do usera, wykonanie idzie dalej.

- **Fix**: Sprawdź czy query zwróciło row, throw jeśli nie

---

## HIGH

### 6. `useAction` w portalu/overlay — view transition blinks

`src/features/dashboard/components/daily-view/active-timers-banner/timer-row/use-timer-row.ts:18-20` — 3× `useAction` w fixed-position overlay. CLAUDE.md mówi: w portalach nie używaj `useAction`.

- **Fix**: Zamień na bezpośrednie `await` wywołania server actions

### 7. Hardcoded polskie stringi — poza `pl.json`

~25 miejsc, głównie w `shopping/`, `notifications/`, `dashboard/`:

| Plik | Przykłady |
|------|-----------|
| `cart-price-sheet.tsx` | `"Tworzę..."`, `"Gotowe"`, `"Suplement"`, `"Cena"`, `"zł"`, `"lub"` |
| `shopping-list.tsx` | `zł` ×6 |
| `shop-edit-sheet.tsx` | `zł` ×2 |
| `price-list.tsx` | `zł` |
| `restock-dialog.tsx` | `zł` |
| `monthly-view.tsx:18` | `["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"]` |
| `existing-supplement-picker.tsx` | `"Brak wyników"` |
| `use-notification-section.ts` | `"Powiadomienie testowe wysłane"`, `"Nie udało się..."` |
| `use-cart-price-sheet.ts` | Hardcoded error toasts |
| `date-navigator.tsx:24,36` | `aria-label="Poprzedni dzień"`, `aria-label="Następny dzień"` |

- **Fix**: Wyciągnij do `pl.json`, użyj `useTranslations()`. Walutę obsłuż przez `Intl.NumberFormat`

### 8. Cross-feature deep imports (3 naruszenia)

- `shopping/price-list.tsx:11` → `@/features/stock/components/stock-list/supplement-edit-sheet`
- `settings/protocol-section.tsx:9-10` → `@/features/dashboard/lib/protocol-colors`
- `protocol-wizard/protocol-preview-page.tsx:2` → `@/features/shopping/api/queries/get-price-list`

- **Fix**: Dodaj do barrel exports albo przenieś do `shared/`

### 9. `markBlockTaken` — N+1: do 40 DB queries na jedno kliknięcie

`src/features/dashboard/api/actions/mark-block-taken.ts:24-42` — pętla po `uncheckedIds`, 4 query na każdy element.

- **Fix**: Batch ownership check z `inArray`, batch inserts

### 10. `sql\`IN ${array}\`` zamiast `inArray()` — niepoprawne użycie Drizzle

- `src/app/api/push/send/route.ts:55-59`
- `src/app/api/push/timers/route.ts:98`

Drizzle `sql` template tag nie parametryzuje tablic automatycznie. Technicznie bezpieczne (dane z DB), ale rekruter czytający kod to natychmiast zflaguje.

- **Fix**: Zamień na `inArray(column, array)`

### 11. `parsedData` i `name` bez limitów rozmiaru

`create-protocol.ts:18`, `update-protocol.ts:16` — `z.string()` bez `.max()`. User może wysłać megabajty JSONa.

- **Fix**: `.max(500_000)` na `parsedData`, `.max(200)` na `name`

### 12. `reactivateProtocol` wskrzesza `finishPackage` schedules

`src/features/settings/api/actions/reactivate-protocol.ts:20-21` — ustawia `active = true` na wszystkich, włącznie z tymi gdzie paczka się skończyła.

- **Fix**: Wyklucz `finishPackage = true` ze stockiem ≤ 0

### 13. Side-effect wewnątrz `useMemo`

`src/features/dashboard/components/daily-view/active-timers-banner/use-active-timers-banner.ts:62-66`:

```ts
const baseTimers = useMemo(() => {
    startRef.current = Date.now();   // mutacja ref
    setElapsedMs(0);                 // setState w renderze!
    return collectTimers(allEntries);
}, [allEntries]);
```

- **Fix**: Przenieś reset do `useEffect`

---

## MEDIUM

### 14. Feature `shopping` niedokumentowana

Cały feature (DB tables, AI route, 5 komponentów, 3 akcje) nie istnieje w PRD, CLAUDE.md, tech-stack.md.

- **Fix**: Zaktualizuj dokumentację

### 15. `notifications` feature bez `index.ts`

Jedyna feature bez barrel exportu. Consumers importują deep paths.

- **Fix**: Dodaj `src/features/notifications/index.ts`

### 16. Brak indeksów w DB schema

Zero explicit indexes. Brakuje na: `supplementSchedules(protocolId)`, `supplementSchedules(supplementId)`, `supplements(userId)`, `protocols(userId)`.

- **Fix**: Dodaj indeksy, `pnpm drizzle-kit generate && pnpm drizzle-kit migrate`

### 17. `blockSortOrder` aliasowane do `startTime` zamiast `sortOrder`

`get-daily-status.ts:95` — schema ma `sortOrder: integer`, a query używa `startTime` i `.localeCompare()`.

- **Fix**: Użyj `timeBlocks.sortOrder`

### 18. `cartScans.items` castowane bez walidacji runtime

`get-recent-scans.ts:33`: `(r.items as CartItem[]) ?? []` — JSON z DB castowany bez Zod parse.

- **Fix**: Zwaliduj z Zod `.catch([])`

### 19. Rate limiter memory leak

`api/protocol/parse/route.ts:25`, `api/cart/parse/route.ts:20` — in-memory `Map` nigdy nie czyści starych wpisów.

- **Fix**: Dodaj periodic cleanup albo użyj LRU map

### 20. `useLogin` nie resetuje `isLoading` na error

`src/features/auth/components/login-page/use-login.ts` — jeśli `signIn.social` rzuci error, przycisk zostaje disabled na zawsze.

- **Fix**: `try/finally { setIsLoading(false) }`

### 21. `useCheckSupplement` — flickering optimistic update

`use-check-supplement.ts:12-14` — `useEffect` sync z `initialChecked` może cofnąć optimistic update.

- **Fix**: Użyj `useOptimistic` albo zrezygnuj z local mirror

### 22. Hardcoded color `#8B6914` × 6 plików

- `shared/components/icon-badge.tsx:16`
- `cart-price-sheet.tsx:252,609`
- `protocol-card.tsx:71`
- `parsed-preview.tsx:153`
- `confidence-badge.tsx:21-22`

- **Fix**: Dodaj token `--color-warning-text` do design systemu

### 23. `error.tsx` — raw `<button>` zamiast `<Button>`, `text-white` zamiast `text-content-inverse`

- **Fix**: Użyj komponentu `Button` i tokena z design systemu

### 24. Component folder violations — single-file w folderze

- `schedule-detail-sheet/` — single file
- `shopping-list/` — single file
- `price-sheet/` — single file

- **Fix**: Wypłaszcz do parent directory

### 25. Dead code w `usePriceList`

`handleSizeBlur` i `localSize` state — zdefiniowane, zwrócone z hooka, nigdy nie używane.

- **Fix**: Usuń

### 26. `ProgressRing` SVG bez `aria-hidden="true"`

- **Fix**: Dodaj `aria-hidden="true"` do dekoracyjnego SVG

### 27. Missing `border` utility na `StockItem` — wizualny bug

`src/features/stock/components/stock-list/stock-item/stock-item.tsx:31` — `border-edge-subtle` bez `border`. Karta renderuje się bez ramki, w przeciwieństwie do reszty kart w projekcie.

- **Fix**: Dodaj `border` przed `border-edge-subtle`

### 28. Hardcoded `POLISH_DAYS` / `POLISH_MONTHS` tablice

`src/features/dashboard/components/daily-view/date-navigator/use-date-navigator.ts:3-26` — ręczne tablice polskich nazw dni i miesięcy zamiast `Intl.DateTimeFormat` z locale `pl` lub next-intl.

- **Fix**: Użyj `Intl.DateTimeFormat("pl", { weekday: "long" })` albo kluczy z `pl.json`

### 29. Duplicate `getTodayString()` vs shared `toDateString()`

`dashboard-page.tsx:5-12` definiuje lokalnie to samo co `shared/lib/date.ts`.

- **Fix**: Użyj `toDateString()`

### 30. `ShopOption` type zduplikowany 5×

`{ id: string; name: string }` w `supplement-form.tsx`, `supplement-fields.tsx`, `stock-list.tsx`, `stock-item.tsx`, `supplement-edit-sheet.tsx`.

- **Fix**: Zdefiniuj raz, importuj

### 31. `enforceCooldown` — 2 identyczne query zamiast jednego

`mark-taken.ts:66-86` — dwa query z tym samym WHERE na `supplementSchedules`.

- **Fix**: Zmerguj w jeden query

### 32. `NotificationSection` — `blockSettings` bez `useMemo`

`use-notification-section.ts:36-47` — nowa tablica na każdy render, psuje `useOptimistic` i `useCallback`.

- **Fix**: Wrap w `useMemo([timeBlocks, initialSettings])`

---

## LOW

### 33. Triple session lookup na każdą stronę

`(app)/layout.tsx` → `(main)/layout.tsx` → `page.tsx` — 3× `auth.api.getSession()`.

- **Fix**: Usuń redundantny check z `(main)/layout.tsx`

### 34. `ProtocolStatus` filter z wszystkimi wartościami enum = no-op

`get-user-protocols.ts:45-52` — `inArray` z pełną listą enum.

- **Fix**: Usuń zbędny filter

### 35. Push subscriptions bez limitu per user

- **Fix**: Dodaj cap (np. 5) i evict najstarsze

### 36. `updateNotificationSettings` nie weryfikuje ownership `timeBlockId`

- **Fix**: Sprawdź że `timeBlockId` należy do `userId`

### 37. `sortOrder` race condition na concurrent `addTimeBlock`

- **Fix**: Użyj `MAX(sort_order) + 1` w query albo dodaj unique constraint

### 38. `icon` field nie walidowany vs allowed icon names

`add-time-block.ts:10`, `update-time-block.ts:14` — `z.string().min(1)` zamiast `z.enum(ALLOWED_ICONS)`.

- **Fix**: Wyeksportuj `ALLOWED_ICONS`, użyj `z.enum()`

### 39. `saveDraftProtocol` zwraca cały obiekt z `parsedData` do klienta

- **Fix**: Zwróć tylko `{ protocolId: protocol.id }`

### 40. `price-sheet.tsx` — `text-muted-foreground` zamiast `text-content-muted`, `px-4` zamiast `px-md`

- **Fix**: Użyj tokenów z design systemu

### 41. `PriceSheet` — dwa buttony ("Zapisz"/"Później") robią to samo

- **Fix**: Usuń duplikat albo dodaj logikę zapisu

### 42. Inline `useEffect` polling w komponentach zamiast w hookach

- `protocol-section.tsx:27-35`
- `price-list.tsx:32-39`

- **Fix**: Przenieś do odpowiednich hooków

### 43. `SupplementCategory` cast `as SupplementCategory`

`supplement-row.tsx:243` — pole w `ScheduleEntry` typowane jako `string` zamiast `SupplementCategory`.

- **Fix**: Popraw typ w `get-daily-status.ts:31`

### 44. Brak `error.tsx` w podstronach

Jedyny `error.tsx` na root level. Brak w `(app)/(main)/`.

- **Fix**: Dodaj `error.tsx` przynajmniej w `(app)/(main)/`

### 45. Zero `loading.tsx` / brak `<Suspense>` boundaries

Żaden route nie ma `loading.tsx`. Zero `<Suspense>` w codebase. Brak skeleton UI — na mobile każda nawigacja blokuje bez feedbacku.

- **Fix**: Dodaj `loading.tsx` do `dashboard/`, `stock/`, `settings/`, `shopping/`

### 46. Brak `README.md`

Publiczne repo bez README = instant skip przy rekrutacji.

- **Fix**: Opis + screenshoty, tech stack, `.env.example`, instrukcja uruchomienia, architektura

### 47. Brak testów (poza `optimizeShopping`)

- **Fix**: Testy server actions, `stock-forecast.ts`, `build-schedule-entry.ts`, `cooldown.ts`

---

## Co jest dobrze (nie ruszać)

- Auth middleware (`authActionClient`) + ownership checks w akcjach (poza #3, #5, #34)
- Zod validation w każdej server action
- Feature barrel exports — zero deep imports z `src/app/`
- 100% kebab-case naming
- Dashboard query z JOINami (zero N+1 na głównym query)
- Spójny error handling pattern (`ActionError` + error codes + tłumaczenia)
- Zero `as any`, zero `TODO`, zero dead imports w głównym kodzie

---

# Roadmapa naprawiania

## Faza 1 — Showstoppers (blokują release)

- [ ] #1 — Zamontuj `<Toaster />`
- [ ] #2 — Napraw malformed CSS view transitions
- [ ] #3 — Ownership check w `adjustTimer` i `skipWaitTimer`
- [ ] #4 — Guard na `CRON_SECRET`
- [ ] #5 — Weryfikacja wyniku ownership query w `skipCooldown`

## Faza 2 — Security & poprawność danych

- [ ] #10 — `inArray()` zamiast `sql IN`
- [ ] #11 — Limity rozmiaru na `parsedData` i `name`
- [ ] #36 — Ownership check na `timeBlockId` w notifications
- [ ] #35 — Limit push subscriptions per user
- [ ] #38 — Walidacja `icon` vs allowed icons

## Faza 3 — React correctness

- [ ] #6 — Zamień `useAction` na `await` w timer overlay
- [ ] #13 — Usuń side-effects z `useMemo`
- [ ] #20 — `try/finally` w `useLogin`
- [ ] #21 — Fix flickering optimistic update
- [ ] #32 — `useMemo` na `blockSettings`

## Faza 4 — Architektura & konwencje

- [ ] #8 — Napraw cross-feature deep imports
- [ ] #14 — Dokumentacja feature `shopping`
- [ ] #15 — Barrel export dla `notifications`
- [ ] #24 — Wypłaszcz single-file component folders
- [ ] #42 — Przenieś inline `useEffect` polling do hooków
- [ ] #12 — Fix `reactivateProtocol` vs `finishPackage`
- [ ] #27 — Missing `border` na `StockItem`

## Faza 5 — Performance & DB

- [ ] #9 — Batch queries w `markBlockTaken`
- [ ] #16 — Dodaj indeksy DB
- [ ] #17 — Popraw `blockSortOrder` aliasing
- [ ] #31 — Zmerguj duplicate query w `enforceCooldown`
- [ ] #33 — Usuń triple session lookup
- [ ] #34 — Usuń no-op filter

## Faza 6 — Code quality cleanup

- [ ] #7 — Hardcoded stringi → `pl.json`
- [ ] #28 — Hardcoded `POLISH_DAYS`/`POLISH_MONTHS` → `Intl.DateTimeFormat`
- [ ] #22 — Token `--color-warning-text`
- [ ] #23 — `Button` + `text-content-inverse` w `error.tsx`
- [ ] #25 — Usuń dead code w `usePriceList`
- [ ] #26 — `aria-hidden` na SVG
- [ ] #29 — Użyj shared `toDateString()`
- [ ] #30 — Deduplikacja `ShopOption`
- [ ] #40 — Design system tokens w `price-sheet.tsx`
- [ ] #43 — Popraw typ `SupplementCategory`

## Faza 7 — UX & portfolio polish

- [ ] #44 — Dodaj `error.tsx` w podstronach
- [ ] #45 — Dodaj `loading.tsx` / `<Suspense>` ze skeleton UI
- [ ] #46 — Napisz `README.md`
- [ ] #47 — Dodaj testy
- [ ] #39 — Ogranicz response z `saveDraftProtocol`
- [ ] #41 — Fix `PriceSheet` duplicate buttons
- [ ] #18 — Runtime validation na `cartScans.items`
- [ ] #19 — Cleanup rate limiter map
- [ ] #37 — Fix `sortOrder` race condition
