# Eksport protokołu do PDF / Excel

Data: 2026-05-17
Status: zaakceptowany projekt (oczekuje na review spec)

## Cel

Umożliwić wyeksportowanie **struktury protokołu** do dwóch formatów:

- **PDF** — czytelny dla człowieka, do pokazania lekarzowi lub innej osobie.
- **Excel (XLSX)** — płaska, strukturalna tabela, łatwa do wklejenia LLM-owi w celu weryfikacji, czy protokół zgadza się z zaleceniami lekarza.

Zakres danych: **wyłącznie struktura protokołu** (bez historii przyjmowania / adherence z `DailyLog`).

## Decyzje (z brainstormingu)

| Pytanie | Decyzja |
|---|---|
| Format | PDF + Excel (oba) |
| Zakres danych | Tylko struktura protokołu |
| Miejsce uruchomienia | Karta protokołu w Ustawieniach, akcja obok Edytuj/Udostępnij |
| Objęte statusy | draft, active, archived (NIE processing/failed) |
| Biblioteka PDF | `@react-pdf/renderer` (server-side, komponenty React → PDF) |
| Biblioteka Excel | `exceljs` (już w projekcie, używany dotąd tylko do parsowania) |
| Sposób pracy | TDD: małe, czyste, otestowane funkcje → kompozycja w funkcjonalność (zgodnie z konwencją repo) |

## Architektura

### Przepływ

```
Karta protokołu (ProtocolSection)
  → przycisk "Eksportuj" (dropdown: PDF / Excel)
    → GET /api/protocol/[id]/export?format=pdf|xlsx
      → autoryzacja sesją (Better Auth)
      → getProtocolForExport(protocolId, userId)   [czysta query + repozytoria]
      → mapToExportRows(...)                        [czysta funkcja mapująca]
      → buildProtocolXlsx(model) | buildProtocolPdf(model)
      → Response z Content-Disposition: attachment
```

Pobieranie pliku = Route Handler (zgodnie z CLAUDE.md: pliki / integracje zewnętrzne → API Routes, nie Server Action).

### Komponenty (jednostki o jednej odpowiedzialności)

1. **Query: `getProtocolForExport(protocolId, userId)`**
   - Lokalizacja: `src/features/settings/api/queries/get-protocol-for-export.ts`
   - Reużywa `protocolRepository.findByIdAndUserId` (rzuca przy braku/cudzym protokole) oraz `supplementScheduleRepository.findByProtocolId` + joiny do `supplement` i `timeBlock`.
   - Filtruje schedules `active === true`.
   - Zwraca surowy, niesformatowany model dziedzinowy (nazwa protokołu, status, startDate, lista schedule z polami supplement/timeBlock).
   - Status `processing` / `failed` → sygnalizuje błąd domenowy (Route Handler mapuje na 400).

2. **Mapper: `mapToExportRows(protocol)` → `ProtocolExportModel`**
   - Lokalizacja: `src/features/settings/api/services/protocol-export-model.ts`
   - Czysta funkcja, zero I/O. Spłaszcza i sortuje wpisy wg `timeBlock.startTime` → `sortOrder`.
   - `ProtocolExportModel`: `{ name, startDate, status, generatedAt, rows: ProtocolExportRow[] }`
   - `ProtocolExportRow`: `{ timeBlockName, timeBlockStartTime, supplementName, brandName, category, dosageAmount, dosageUnit, isCritical, cycleDaysOn, cycleDaysOff, startDayOffset, durationDays, notes }`
   - Wspólny model wejściowy dla OBU generatorów — jedno źródło prawdy o kształcie eksportu.

3. **Generator Excel: `buildProtocolXlsx(model) → Buffer`**
   - Lokalizacja: `src/features/settings/api/services/protocol-xlsx.ts`
   - `exceljs`. Jeden arkusz. Wiersze nagłówkowe: nazwa protokołu, data startu, data wygenerowania. Następnie wiersz nagłówków kolumn i jedna płaska tabela:
     `Blok | Godzina | Suplement | Marka | Kategoria | Dawka | Jednostka | Krytyczny | Cykl on | Cykl off | Offset startu (dni) | Czas trwania (dni) | Notatki`
   - Płaski układ = optymalny dla LLM.

4. **Generator PDF: `buildProtocolPdf(model) → Buffer`**
   - Lokalizacja: `src/features/settings/api/services/protocol-pdf.tsx`
   - `@react-pdf/renderer`, render server-side do bufora.
   - Layout: nagłówek (nazwa protokołu, data startu, data wygenerowania), tabela pogrupowana wg bloku czasowego (godzina + nazwa bloku jako podnagłówek), kolumny: `Suplement | Dawka | Cykl | Czas trwania | Notatki`. Wpisy krytyczne wyróżnione wizualnie. Stopka: „Wygenerowano w PillPilot — do weryfikacji z zaleceniami lekarza".
   - Polskie znaki: rejestracja fontu z pełną obsługą diakrytyków PL (spakowany plik TTF w repo).

5. **Route Handler: `GET /api/protocol/[id]/export`**
   - Lokalizacja: `src/app/api/protocol/[id]/export/route.ts`
   - Czyta sesję (Better Auth) → brak → 401.
   - Waliduje `format` przez zod (`"pdf" | "xlsx"`) → nieznany → 400.
   - Woła query → mapper → wybrany generator.
   - Zwraca `Response(buffer)` z `Content-Type` (`application/pdf` lub `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) i `Content-Disposition: attachment; filename="<slug-protokolu>-YYYY-MM-DD.<ext>"`.

6. **UI: przycisk eksportu na karcie protokołu**
   - Komponent + hook → folder z barrelem (konwencja repo: komponent z hookiem = folder).
   - Dodany w `ProtocolSection` obok akcji Edytuj/Udostępnij/Archiwizuj.
   - shadcn/ui dropdown z dwiema pozycjami (PDF / Excel) → nawigacja do URL eksportu (`<a download>` / `window.location`).
   - Logika (budowa URL, wybór formatu) wyekstrahowana do hooka — brak inline logiki w ciele komponentu.

## Obsługa błędów

| Sytuacja | Odpowiedź |
|---|---|
| Brak sesji | 401 |
| Protokół nie istnieje lub należy do innego usera | 404 (query rzuca) |
| Status `processing` / `failed` | 400 z komunikatem |
| Pusty protokół (0 aktywnych schedules) | poprawny plik z nagłówkiem i pustą tabelą (NIE błąd) |
| Nieznany `format` | 400 |

## Strategia testów (TDD — test przed implementacją każdej jednostki)

Kolejność TDD: najpierw czyste funkcje (mapper, generatory), potem query, na końcu kompozycja w Route Handler.

1. **`mapToExportRows`** (czysta, najłatwiejsza do TDD — start tutaj)
   - sortowanie wg `timeBlock.startTime` → `sortOrder`
   - poprawne spłaszczenie pól supplement/timeBlock
   - pusty protokół → pusta lista `rows`, nagłówek wypełniony
   - poprawne przenoszenie pól nullable (notes, cycle, durationDays)

2. **`buildProtocolXlsx`**
   - liczba wierszy = nagłówki + N rows
   - poprawne etykiety kolumn i mapowanie wartości
   - polskie diakrytyki zachowane
   - pusty model → plik z samym nagłówkiem (bez crash)

3. **`buildProtocolPdf`**
   - smoke test: niepusty bufor PDF dla reprezentatywnego modelu (w tym znaki PL i wpis krytyczny)
   - pusty model → poprawny, niepusty bufor (nagłówek + pusta sekcja)

4. **`getProtocolForExport`**
   - poprawne złożenie z repozytoriów
   - rzuca przy cudzym/nieistniejącym protokole
   - filtruje schedules nieaktywne
   - status processing/failed → błąd domenowy

5. **Route Handler**
   - `format=xlsx` → poprawny Content-Type + Content-Disposition
   - `format=pdf` → poprawny Content-Type + Content-Disposition
   - zły format → 400
   - brak autoryzacji → 401
   - protokół processing/failed → 400

## Zależności

- **Nowa:** `@react-pdf/renderer`
- **Istniejąca, reużywana:** `exceljs`, `zod`, Better Auth, `protocolRepository`, `supplementScheduleRepository`

## Poza zakresem (YAGNI)

- Historia przyjmowania / statystyki adherence
- Eksport ze strony udostępnionego protokołu (shareToken)
- Eksport zbiorczy wielu protokołów naraz
- Eksport do Markdown/CSV
- Konfigurowalny układ / wybór kolumn przez użytkownika
