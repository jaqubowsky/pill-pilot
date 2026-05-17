# Protocol Export (PDF / Excel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-protocol export to PDF and Excel from the settings protocol card, so a user can hand the protocol structure to a doctor/person or paste it to an LLM for verification.

**Architecture:** A thin Route Handler `GET /api/protocol/[id]/export?format=pdf|xlsx` authenticates via Better Auth, calls a DB query (`getProtocolForExport`) that joins schedules→supplements→timeBlocks, passes raw rows through a pure mapper (`mapToExportRows`) into a shared `ProtocolExportModel`, then into one of two pure generators (`buildProtocolXlsx`, `buildProtocolPdf`). UI is a Popover button (PDF / Excel links) added to the draft/active/archived protocol-card actions.

**Tech Stack:** Next.js 16 App Router (Route Handler, node runtime), `exceljs` (already installed), `@react-pdf/renderer` (new), Vitest, Better Auth, Drizzle, next-intl.

**Spec:** `docs/superpowers/specs/2026-05-17-protocol-export-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/features/settings/api/services/protocol-export-model.ts` | Pure types + `mapToExportRows` + `toExportFilename` |
| `src/features/settings/api/services/protocol-export-model.test.ts` | Tests for mapper + filename |
| `src/features/settings/api/services/protocol-xlsx.ts` | Pure `buildProtocolXlsx(model)` |
| `src/features/settings/api/services/protocol-xlsx.test.ts` | XLSX content tests |
| `src/features/settings/api/services/protocol-pdf.tsx` | Pure `buildProtocolPdf(model)` + Font.register |
| `src/features/settings/api/services/protocol-pdf.test.ts` | PDF smoke tests |
| `src/features/settings/api/queries/get-protocol-for-export.ts` | DB query: raw `ProtocolForExportData` (joins, ownership) |
| `src/app/api/protocol/[id]/export/route.ts` | Route Handler: auth, status gate, format gate, stream file (no unit test — repo convention: only pure business fns are tested) |
| `src/features/settings/components/settings-page/protocol-section/protocol-card/export-protocol-button/` | UI: component + hook + barrel |
| `public/fonts/Roboto-Regular.ttf`, `public/fonts/Roboto-Bold.ttf` | Vendored fonts with Polish glyph coverage |
| `next.config.ts` | Add `serverExternalPackages` for pdf/excel libs |
| `src/shared/i18n/messages/pl.json` | Export UI labels |

---

## Task 1: Project setup (dependency, fonts, config, i18n)

**Files:**
- Modify: `package.json` (via pnpm)
- Create: `public/fonts/Roboto-Regular.ttf`, `public/fonts/Roboto-Bold.ttf`
- Modify: `next.config.ts`
- Modify: `src/shared/i18n/messages/pl.json`

- [ ] **Step 1: Install the PDF library**

Run:
```bash
pnpm add @react-pdf/renderer
```
Expected: `@react-pdf/renderer` added to `dependencies` in `package.json`, install completes without error.

- [ ] **Step 2: Vendor Polish-capable fonts**

Run:
```bash
mkdir -p public/fonts
curl -fsSL "https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto/Roboto_400Regular.ttf" -o public/fonts/Roboto-Regular.ttf
curl -fsSL "https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto/Roboto_700Bold.ttf" -o public/fonts/Roboto-Bold.ttf
file public/fonts/Roboto-Regular.ttf public/fonts/Roboto-Bold.ttf
```
Expected: `file` reports both as TrueType Font data. (Roboto covers Latin Extended-A: ą ć ę ł ń ó ś ź ż.)

- [ ] **Step 3: Mark heavy libs as server-external**

Read `next.config.ts` first. Add `serverExternalPackages: ["@react-pdf/renderer", "exceljs"]` to the config object (merge with existing keys; do not remove `viewTransition`).

Example resulting shape (preserve existing keys):
```ts
const nextConfig: NextConfig = {
	// ...existing keys (e.g. experimental.viewTransition) unchanged...
	serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
};
```

- [ ] **Step 4: Add i18n labels**

Read `src/shared/i18n/messages/pl.json`. Inside the existing top-level `"settings"` object, add an `"export"` key:
```json
"export": {
	"label": "Eksportuj",
	"pdf": "PDF (do druku / dla osoby)",
	"excel": "Excel (dla LLM / weryfikacji)"
}
```
(Insert as a sibling of existing `settings.*` keys; keep JSON valid — mind trailing commas.)

- [ ] **Step 5: Verify build tooling still green**

Run:
```bash
pnpm lint && pnpm test
```
Expected: lint passes, existing tests pass (no new tests yet).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts public/fonts src/shared/i18n/messages/pl.json
git commit -m "chore: add @react-pdf/renderer, vendor Roboto fonts, export i18n"
```

---

## Task 2: `toExportFilename` pure helper (TDD)

**Files:**
- Create: `src/features/settings/api/services/protocol-export-model.ts`
- Test: `src/features/settings/api/services/protocol-export-model.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/settings/api/services/protocol-export-model.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { toExportFilename } from "./protocol-export-model";

describe("toExportFilename", () => {
	it("slugifies name, strips Polish diacritics, appends date and extension", () => {
		expect(toExportFilename("Protokół Jelitowy", "pdf", "2026-05-17")).toBe(
			"protokol-jelitowy-2026-05-17.pdf",
		);
	});

	it("collapses non-alphanumerics and trims dashes", () => {
		expect(toExportFilename("  Mój / Plan #1  ", "xlsx", "2026-01-02")).toBe(
			"moj-plan-1-2026-01-02.xlsx",
		);
	});

	it("falls back to 'protokol' when name has no usable characters", () => {
		expect(toExportFilename("———", "pdf", "2026-05-17")).toBe("protokol-2026-05-17.pdf");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/features/settings/api/services/protocol-export-model.test.ts`
Expected: FAIL — module/export `toExportFilename` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/settings/api/services/protocol-export-model.ts`:
```ts
export function toExportFilename(name: string, ext: "pdf" | "xlsx", dateString: string): string {
	const slug = name
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const base = slug.length > 0 ? slug : "protokol";
	return `${base}-${dateString}.${ext}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/features/settings/api/services/protocol-export-model.test.ts`
Expected: PASS (3 passing).

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/api/services/protocol-export-model.ts src/features/settings/api/services/protocol-export-model.test.ts
git commit -m "feat: toExportFilename slug helper"
```

---

## Task 3: `mapToExportRows` + export types (TDD)

**Files:**
- Modify: `src/features/settings/api/services/protocol-export-model.ts`
- Test: `src/features/settings/api/services/protocol-export-model.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/features/settings/api/services/protocol-export-model.test.ts`:
```ts
import { mapToExportRows, type ProtocolForExportData } from "./protocol-export-model";

function baseSchedule(
	over: Partial<ProtocolForExportData["schedules"][number]> = {},
): ProtocolForExportData["schedules"][number] {
	return {
		dosageAmount: "1.00",
		dosageUnit: "capsule",
		notes: null,
		isCritical: false,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		sortOrder: 0,
		active: true,
		supplement: { name: "Magnez", brandName: null, category: "mineral" },
		timeBlock: { name: "Śniadanie", startTime: "08:00" },
		...over,
	};
}

describe("mapToExportRows", () => {
	it("filters out inactive schedules", () => {
		const data: ProtocolForExportData = {
			name: "P",
			status: "active",
			startDate: "2026-05-01",
			schedules: [baseSchedule({ active: false }), baseSchedule()],
		};
		const model = mapToExportRows(data, "2026-05-17");
		expect(model.rows).toHaveLength(1);
	});

	it("sorts by timeBlock.startTime then sortOrder", () => {
		const data: ProtocolForExportData = {
			name: "P",
			status: "active",
			startDate: null,
			schedules: [
				baseSchedule({ timeBlock: { name: "Wieczór", startTime: "20:00" }, sortOrder: 0 }),
				baseSchedule({ timeBlock: { name: "Rano", startTime: "08:00" }, sortOrder: 1 }),
				baseSchedule({ timeBlock: { name: "Rano", startTime: "08:00" }, sortOrder: 0 }),
			],
		};
		const rows = mapToExportRows(data, "2026-05-17").rows;
		expect(rows.map((r) => [r.timeBlockStartTime, r.sortOrder])).toEqual([
			["08:00", 0],
			["08:00", 1],
			["20:00", 0],
		]);
	});

	it("carries nullable fields and header through", () => {
		const data: ProtocolForExportData = {
			name: "Mój Protokół",
			status: "draft",
			startDate: "2026-05-01",
			schedules: [
				baseSchedule({
					notes: "po jedzeniu",
					cycleDaysOn: 5,
					cycleDaysOff: 2,
					durationDays: 30,
					supplement: { name: "Wit. D", brandName: "Acme", category: "vitamin" },
				}),
			],
		};
		const model = mapToExportRows(data, "2026-05-17");
		expect(model.name).toBe("Mój Protokół");
		expect(model.startDate).toBe("2026-05-01");
		expect(model.generatedAt).toBe("2026-05-17");
		expect(model.rows[0]).toMatchObject({
			notes: "po jedzeniu",
			cycleDaysOn: 5,
			cycleDaysOff: 2,
			durationDays: 30,
			brandName: "Acme",
			category: "vitamin",
		});
	});

	it("returns empty rows but populated header for empty protocol", () => {
		const data: ProtocolForExportData = {
			name: "Pusty",
			status: "active",
			startDate: null,
			schedules: [],
		};
		const model = mapToExportRows(data, "2026-05-17");
		expect(model.rows).toEqual([]);
		expect(model.name).toBe("Pusty");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/features/settings/api/services/protocol-export-model.test.ts`
Expected: FAIL — `mapToExportRows` / `ProtocolForExportData` not exported.

- [ ] **Step 3: Write minimal implementation**

Prepend to `src/features/settings/api/services/protocol-export-model.ts` (keep existing `toExportFilename`):
```ts
import type { DosageUnit, ProtocolStatus, SupplementCategory } from "@/shared/db/schema";

export type ProtocolForExportData = {
	name: string;
	status: ProtocolStatus;
	startDate: string | null;
	schedules: {
		dosageAmount: string;
		dosageUnit: DosageUnit;
		notes: string | null;
		isCritical: boolean;
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		startDayOffset: number;
		durationDays: number | null;
		sortOrder: number;
		active: boolean;
		supplement: { name: string; brandName: string | null; category: SupplementCategory };
		timeBlock: { name: string; startTime: string };
	}[];
};

export type ProtocolExportRow = {
	timeBlockName: string;
	timeBlockStartTime: string;
	supplementName: string;
	brandName: string | null;
	category: SupplementCategory;
	dosageAmount: string;
	dosageUnit: DosageUnit;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	notes: string | null;
};

export type ProtocolExportModel = {
	name: string;
	startDate: string | null;
	generatedAt: string;
	rows: ProtocolExportRow[];
};

export function mapToExportRows(
	data: ProtocolForExportData,
	generatedAt: string,
): ProtocolExportModel {
	const rows: ProtocolExportRow[] = data.schedules
		.filter((s) => s.active)
		.map((s) => ({
			timeBlockName: s.timeBlock.name,
			timeBlockStartTime: s.timeBlock.startTime,
			supplementName: s.supplement.name,
			brandName: s.supplement.brandName,
			category: s.supplement.category,
			dosageAmount: s.dosageAmount,
			dosageUnit: s.dosageUnit,
			isCritical: s.isCritical,
			cycleDaysOn: s.cycleDaysOn,
			cycleDaysOff: s.cycleDaysOff,
			startDayOffset: s.startDayOffset,
			durationDays: s.durationDays,
			notes: s.notes,
		}))
		.sort((a, b) => {
			if (a.timeBlockStartTime !== b.timeBlockStartTime) {
				return a.timeBlockStartTime < b.timeBlockStartTime ? -1 : 1;
			}
			return 0;
		});

	return { name: data.name, startDate: data.startDate, generatedAt, rows };
}
```

Note: schedules arrive already ordered by `(timeBlock.startTime, sortOrder)` from the query (Task 5); the sort here only stabilises by start time and `Array.prototype.sort` is stable in V8, preserving sortOrder. The test injects pre-shuffled data to prove the start-time ordering.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/features/settings/api/services/protocol-export-model.test.ts`
Expected: PASS (all `toExportFilename` + `mapToExportRows` cases).

- [ ] **Step 5: Check LSP diagnostics**

Confirm no type errors in `protocol-export-model.ts` (imports resolve: `DosageUnit`, `ProtocolStatus`, `SupplementCategory` exist in `@/shared/db/schema`).

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/api/services/protocol-export-model.ts src/features/settings/api/services/protocol-export-model.test.ts
git commit -m "feat: mapToExportRows + protocol export model types"
```

---

## Task 4: `buildProtocolXlsx` generator (TDD)

**Files:**
- Create: `src/features/settings/api/services/protocol-xlsx.ts`
- Test: `src/features/settings/api/services/protocol-xlsx.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/settings/api/services/protocol-xlsx.test.ts`:
```ts
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { ProtocolExportModel } from "./protocol-export-model";
import { buildProtocolXlsx } from "./protocol-xlsx";

const model: ProtocolExportModel = {
	name: "Protokół Jelitowy",
	startDate: "2026-05-01",
	generatedAt: "2026-05-17",
	rows: [
		{
			timeBlockName: "Śniadanie",
			timeBlockStartTime: "08:00",
			supplementName: "Magnez",
			brandName: "Acme",
			category: "mineral",
			dosageAmount: "2.00",
			dosageUnit: "capsule",
			isCritical: true,
			cycleDaysOn: 5,
			cycleDaysOff: 2,
			startDayOffset: 0,
			durationDays: 30,
			notes: "po jedzeniu",
		},
	],
};

async function readBack(buffer: Buffer) {
	const wb = new ExcelJS.Workbook();
	await wb.xlsx.load(buffer);
	return wb.worksheets[0];
}

describe("buildProtocolXlsx", () => {
	it("returns a non-empty xlsx buffer", async () => {
		const buf = await buildProtocolXlsx(model);
		expect(buf.length).toBeGreaterThan(0);
	});

	it("writes header rows with protocol name and dates", async () => {
		const ws = await readBack(await buildProtocolXlsx(model));
		const flat = ws.getSheetValues().flat().filter(Boolean).join(" ");
		expect(flat).toContain("Protokół Jelitowy");
		expect(flat).toContain("2026-05-01");
		expect(flat).toContain("2026-05-17");
	});

	it("writes one data row per schedule with Polish text preserved", async () => {
		const ws = await readBack(await buildProtocolXlsx(model));
		const flat = ws.getSheetValues().flat().filter(Boolean).join(" | ");
		expect(flat).toContain("Śniadanie");
		expect(flat).toContain("Magnez");
		expect(flat).toContain("po jedzeniu");
		expect(flat).toContain("Tak"); // isCritical -> "Tak"
	});

	it("handles an empty protocol without throwing", async () => {
		const buf = await buildProtocolXlsx({ ...model, rows: [] });
		expect(buf.length).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/features/settings/api/services/protocol-xlsx.test.ts`
Expected: FAIL — `buildProtocolXlsx` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/settings/api/services/protocol-xlsx.ts`:
```ts
import ExcelJS from "exceljs";
import type { ProtocolExportModel } from "./protocol-export-model";

const COLUMNS = [
	"Blok",
	"Godzina",
	"Suplement",
	"Marka",
	"Kategoria",
	"Dawka",
	"Jednostka",
	"Krytyczny",
	"Cykl on (dni)",
	"Cykl off (dni)",
	"Offset startu (dni)",
	"Czas trwania (dni)",
	"Notatki",
];

export async function buildProtocolXlsx(model: ProtocolExportModel): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet("Protokół");

	ws.addRow([`Protokół: ${model.name}`]);
	ws.addRow([`Data startu: ${model.startDate ?? "—"}`]);
	ws.addRow([`Wygenerowano: ${model.generatedAt}`]);
	ws.addRow([]);

	const headerRow = ws.addRow(COLUMNS);
	headerRow.font = { bold: true };

	for (const r of model.rows) {
		ws.addRow([
			r.timeBlockName,
			r.timeBlockStartTime,
			r.supplementName,
			r.brandName ?? "",
			r.category,
			r.dosageAmount,
			r.dosageUnit,
			r.isCritical ? "Tak" : "Nie",
			r.cycleDaysOn ?? "",
			r.cycleDaysOff ?? "",
			r.startDayOffset,
			r.durationDays ?? "",
			r.notes ?? "",
		]);
	}

	const out = await wb.xlsx.writeBuffer();
	return Buffer.from(out as ArrayBuffer);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/features/settings/api/services/protocol-xlsx.test.ts`
Expected: PASS (4 passing).

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/api/services/protocol-xlsx.ts src/features/settings/api/services/protocol-xlsx.test.ts
git commit -m "feat: buildProtocolXlsx generator"
```

---

## Task 5: `buildProtocolPdf` generator (TDD smoke)

**Files:**
- Create: `src/features/settings/api/services/protocol-pdf.tsx`
- Test: `src/features/settings/api/services/protocol-pdf.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/settings/api/services/protocol-pdf.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { ProtocolExportModel } from "./protocol-export-model";
import { buildProtocolPdf } from "./protocol-pdf";

const model: ProtocolExportModel = {
	name: "Protokół Jelitowy ąćęłńóśźż",
	startDate: "2026-05-01",
	generatedAt: "2026-05-17",
	rows: [
		{
			timeBlockName: "Śniadanie",
			timeBlockStartTime: "08:00",
			supplementName: "Magnez",
			brandName: "Acme",
			category: "mineral",
			dosageAmount: "2.00",
			dosageUnit: "capsule",
			isCritical: true,
			cycleDaysOn: 5,
			cycleDaysOff: 2,
			startDayOffset: 0,
			durationDays: 30,
			notes: "po jedzeniu",
		},
	],
};

describe("buildProtocolPdf", () => {
	it("produces a valid non-empty PDF buffer", async () => {
		const buf = await buildProtocolPdf(model);
		expect(buf.length).toBeGreaterThan(1000);
		expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
	});

	it("handles an empty protocol", async () => {
		const buf = await buildProtocolPdf({ ...model, rows: [] });
		expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/features/settings/api/services/protocol-pdf.test.ts`
Expected: FAIL — `buildProtocolPdf` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/settings/api/services/protocol-pdf.tsx`:
```tsx
import path from "node:path";
import {
	Document,
	Font,
	Page,
	renderToBuffer,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import type { ProtocolExportModel } from "./protocol-export-model";

Font.register({
	family: "Roboto",
	fonts: [
		{ src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf") },
		{ src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"), fontWeight: 700 },
	],
});

const s = StyleSheet.create({
	page: { fontFamily: "Roboto", fontSize: 9, padding: 32 },
	title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
	meta: { fontSize: 9, color: "#555", marginBottom: 2 },
	blockHeader: { fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 4 },
	row: { flexDirection: "row", borderBottom: "1px solid #ddd", paddingVertical: 3 },
	cellName: { width: "32%" },
	cellDose: { width: "16%" },
	cellCycle: { width: "16%" },
	cellDur: { width: "14%" },
	cellNotes: { width: "22%" },
	critical: { color: "#b00020", fontWeight: 700 },
	footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: "#888" },
});

function cycleText(on: number | null, off: number | null): string {
	if (on == null && off == null) return "—";
	return `${on ?? "?"} / ${off ?? "?"} dni`;
}

export async function buildProtocolPdf(model: ProtocolExportModel): Promise<Buffer> {
	const groups = new Map<string, typeof model.rows>();
	for (const r of model.rows) {
		const key = `${r.timeBlockStartTime} ${r.timeBlockName}`;
		const list = groups.get(key) ?? [];
		list.push(r);
		groups.set(key, list);
	}

	const doc = (
		<Document>
			<Page size="A4" style={s.page}>
				<Text style={s.title}>{model.name}</Text>
				<Text style={s.meta}>Data startu: {model.startDate ?? "—"}</Text>
				<Text style={s.meta}>Wygenerowano: {model.generatedAt}</Text>

				{[...groups.entries()].map(([key, rows]) => (
					<View key={key}>
						<Text style={s.blockHeader}>{key}</Text>
						{rows.map((r, i) => (
							<View key={`${key}-${i}`} style={s.row}>
								<Text style={[s.cellName, ...(r.isCritical ? [s.critical] : [])]}>
									{r.supplementName}
									{r.brandName ? ` (${r.brandName})` : ""}
								</Text>
								<Text style={s.cellDose}>
									{r.dosageAmount} {r.dosageUnit}
								</Text>
								<Text style={s.cellCycle}>{cycleText(r.cycleDaysOn, r.cycleDaysOff)}</Text>
								<Text style={s.cellDur}>{r.durationDays ? `${r.durationDays} dni` : "—"}</Text>
								<Text style={s.cellNotes}>{r.notes ?? ""}</Text>
							</View>
						))}
					</View>
				))}

				<Text style={s.footer} fixed>
					Wygenerowano w PillPilot — do weryfikacji z zaleceniami lekarza.
				</Text>
			</Page>
		</Document>
	);

	return renderToBuffer(doc);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/features/settings/api/services/protocol-pdf.test.ts`
Expected: PASS (2 passing). If it fails on JSX, confirm the file extension is `.tsx` and `tsconfig` JSX settings apply (project already compiles `.tsx`).

- [ ] **Step 5: Manual Polish-glyph verification**

Run:
```bash
node --input-type=module -e "import('./src/features/settings/api/services/protocol-pdf.tsx').then(async m => { const b = await m.buildProtocolPdf({name:'Protokół ąćęłńóśźż',startDate:'2026-05-01',generatedAt:'2026-05-17',rows:[]}); require('node:fs').writeFileSync('/tmp/protocol-test.pdf', b); console.log('written', b.length); })"
```
Open `/tmp/protocol-test.pdf` and confirm Polish characters render correctly (not boxes/blanks). Delete `/tmp/protocol-test.pdf` after. If glyphs are wrong, the vendored TTF lacks Latin Extended-A — re-fetch a font that covers it.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/api/services/protocol-pdf.tsx src/features/settings/api/services/protocol-pdf.test.ts
git commit -m "feat: buildProtocolPdf generator with Polish font"
```

---

## Task 6: `getProtocolForExport` query

**Files:**
- Create: `src/features/settings/api/queries/get-protocol-for-export.ts`

No unit test: this layer matches the existing repo convention — DB query files (e.g. `get-user-protocols.ts`, `get-protocol-as-parsed.ts`) have no unit tests. Behaviour is exercised by the Route Handler test (Task 7, query mocked) and manual smoke (Task 9).

- [ ] **Step 1: Implement the query**

Create `src/features/settings/api/queries/get-protocol-for-export.ts`:
```ts
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { protocols, supplements, supplementSchedules, timeBlocks } from "@/shared/db/schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import type { ProtocolForExportData } from "@/features/settings/api/services/protocol-export-model";

export async function getProtocolForExport(
	protocolId: string,
	userId: string,
): Promise<ProtocolForExportData> {
	const protocol = await protocolRepository.findByIdAndUserId(protocolId, userId);

	const scheduleRows = await db
		.select({
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			notes: supplementSchedules.notes,
			isCritical: supplementSchedules.isCritical,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			sortOrder: supplementSchedules.sortOrder,
			active: supplementSchedules.active,
			supplement: {
				name: supplements.name,
				brandName: supplements.brandName,
				category: supplements.category,
			},
			timeBlock: {
				name: timeBlocks.name,
				startTime: timeBlocks.startTime,
			},
		})
		.from(supplementSchedules)
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
		.where(eq(supplementSchedules.protocolId, protocolId))
		.orderBy(asc(timeBlocks.startTime), asc(supplementSchedules.sortOrder));

	return {
		name: protocol.name,
		status: protocol.status,
		startDate: protocol.startDate,
		schedules: scheduleRows,
	};
}
```

- [ ] **Step 2: Check LSP diagnostics**

Confirm no type errors. `protocolRepository.findByIdAndUserId` throws `ActionError(PROTOCOL_NOT_FOUND)` for missing/foreign protocol — propagate (handled in Task 7). Confirm `scheduleRows` is assignable to `ProtocolForExportData["schedules"]` (column selection matches the type exactly).

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/api/queries/get-protocol-for-export.ts
git commit -m "feat: getProtocolForExport query"
```

---

## Task 7: Route Handler `GET /api/protocol/[id]/export`

> **CORRECTION (applied during execution):** Per user direction and existing repo convention, route handlers are NOT unit-tested — only pure business functions are (e.g. `cycling.test.ts`; no existing route/query has a test). Implement `route.ts` exactly as in Step 3 below; **skip Steps 1, 2, 4's test run, and do not create `route.test.ts`**. Verification = `pnpm exec tsc --noEmit` (zero errors), `pnpm lint` clean, full `pnpm test` still green, plus the manual edge checks in Task 9. The test-code blocks below are retained only for historical context.

**Files:**
- Create: `src/app/api/protocol/[id]/export/route.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/protocol/[id]/export/route.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/shared/lib/auth", () => ({ auth: { api: { getSession: () => getSession() } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const getProtocolForExport = vi.fn();
vi.mock("@/features/settings/api/queries/get-protocol-for-export", () => ({
	getProtocolForExport: (...a: unknown[]) => getProtocolForExport(...a),
}));
vi.mock("@/features/settings/api/services/protocol-xlsx", () => ({
	buildProtocolXlsx: async () => Buffer.from("XLSXBYTES"),
}));
vi.mock("@/features/settings/api/services/protocol-pdf", () => ({
	buildProtocolPdf: async () => Buffer.from("%PDF-FAKE"),
}));

import { GET } from "./route";

function ctx(id = "p1") {
	return { params: Promise.resolve({ id }) };
}
function req(format?: string) {
	const u = new URL("http://x/api/protocol/p1/export");
	if (format !== undefined) u.searchParams.set("format", format);
	return new Request(u);
}

describe("GET protocol export", () => {
	beforeEach(() => {
		getSession.mockReset();
		getProtocolForExport.mockReset();
		getSession.mockResolvedValue({ user: { id: "u1" } });
		getProtocolForExport.mockResolvedValue({
			name: "P",
			status: "active",
			startDate: null,
			schedules: [],
		});
	});

	it("401 when no session", async () => {
		getSession.mockResolvedValue(null);
		const res = await GET(req("xlsx"), ctx());
		expect(res.status).toBe(401);
	});

	it("400 on unknown format", async () => {
		const res = await GET(req("docx"), ctx());
		expect(res.status).toBe(400);
	});

	it("400 when protocol status is processing", async () => {
		getProtocolForExport.mockResolvedValue({
			name: "P",
			status: "processing",
			startDate: null,
			schedules: [],
		});
		const res = await GET(req("pdf"), ctx());
		expect(res.status).toBe(400);
	});

	it("404 when query throws not-found", async () => {
		getProtocolForExport.mockRejectedValue(new Error("PROTOCOL_NOT_FOUND"));
		const res = await GET(req("pdf"), ctx());
		expect(res.status).toBe(404);
	});

	it("200 xlsx with attachment headers", async () => {
		const res = await GET(req("xlsx"), ctx());
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("spreadsheetml");
		expect(res.headers.get("content-disposition")).toContain('attachment; filename="p-');
	});

	it("200 pdf with attachment headers", async () => {
		const res = await GET(req("pdf"), ctx());
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("application/pdf");
		expect(res.headers.get("content-disposition")).toContain(".pdf");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/app/api/protocol/\[id\]/export/route.test.ts`
Expected: FAIL — `./route` has no `GET` export.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/api/protocol/[id]/export/route.ts`:
```ts
import { headers } from "next/headers";
import { auth } from "@/shared/lib/auth";
import { getProtocolForExport } from "@/features/settings/api/queries/get-protocol-for-export";
import {
	mapToExportRows,
	toExportFilename,
} from "@/features/settings/api/services/protocol-export-model";
import { buildProtocolPdf } from "@/features/settings/api/services/protocol-pdf";
import { buildProtocolXlsx } from "@/features/settings/api/services/protocol-xlsx";
import { toDateString } from "@/shared/lib/date";

export const runtime = "nodejs";

const EXPORTABLE = new Set(["draft", "active", "archived"]);
const XLSX_MIME =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const format = new URL(request.url).searchParams.get("format");
	if (format !== "pdf" && format !== "xlsx") {
		return Response.json({ error: "invalid_format" }, { status: 400 });
	}

	const { id } = await params;

	let data: Awaited<ReturnType<typeof getProtocolForExport>>;
	try {
		data = await getProtocolForExport(id, session.user.id);
	} catch {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	if (!EXPORTABLE.has(data.status)) {
		return Response.json({ error: "not_exportable" }, { status: 400 });
	}

	const generatedAt = toDateString(new Date());
	const model = mapToExportRows(data, generatedAt);
	const filename = toExportFilename(model.name, format, generatedAt);

	const body =
		format === "pdf" ? await buildProtocolPdf(model) : await buildProtocolXlsx(model);
	const contentType = format === "pdf" ? "application/pdf" : XLSX_MIME;

	return new Response(new Uint8Array(body), {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-store",
		},
	});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/app/api/protocol/\[id\]/export/route.test.ts`
Expected: PASS (6 passing).

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/protocol/[id]/export/route.ts" "src/app/api/protocol/[id]/export/route.test.ts"
git commit -m "feat: protocol export route handler"
```

---

## Task 8: Export button UI (component + hook + barrel) and wiring

**Files:**
- Create: `.../protocol-card/export-protocol-button/export-protocol-button.tsx`
- Create: `.../protocol-card/export-protocol-button/use-export-protocol-button.ts`
- Create: `.../protocol-card/export-protocol-button/index.ts`
- Modify: `.../protocol-card-actions/draft-actions.tsx`, `active-actions.tsx`, `archived-actions.tsx`

(Base dir: `src/features/settings/components/settings-page/protocol-section/protocol-card/`)

- [ ] **Step 1: Confirm Popover exports**

Read `src/shared/components/ui/popover.tsx`. Confirm it exports `Popover`, `PopoverTrigger`, `PopoverContent` (shadcn standard). If names differ, adjust imports in Step 3 accordingly.

- [ ] **Step 2: Create the hook**

Create `export-protocol-button/use-export-protocol-button.ts`:
```ts
"use client";

export function useExportProtocolButton(protocolId: string) {
	const base = `/api/protocol/${protocolId}/export`;
	return {
		pdfHref: `${base}?format=pdf`,
		excelHref: `${base}?format=xlsx`,
	};
}
```

- [ ] **Step 3: Create the component**

Create `export-protocol-button/export-protocol-button.tsx`:
```tsx
"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useExportProtocolButton } from "./use-export-protocol-button";

export function ExportProtocolButton({ protocolId }: { protocolId: string }) {
	const t = useTranslations("settings");
	const { pdfHref, excelHref } = useExportProtocolButton(protocolId);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full">
					<Download className="mr-2 size-4" />
					{t("export.label")}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="flex w-56 flex-col gap-2">
				<a href={pdfHref} download className="w-full">
					<Button variant="ghost" className="w-full justify-start">
						{t("export.pdf")}
					</Button>
				</a>
				<a href={excelHref} download className="w-full">
					<Button variant="ghost" className="w-full justify-start">
						{t("export.excel")}
					</Button>
				</a>
			</PopoverContent>
		</Popover>
	);
}
```

- [ ] **Step 4: Create the barrel**

Create `export-protocol-button/index.ts`:
```ts
export { ExportProtocolButton } from "./export-protocol-button";
```

- [ ] **Step 5: Wire into the three action components**

In each of `protocol-card-actions/active-actions.tsx`, `draft-actions.tsx`, `archived-actions.tsx`: add the import and render `<ExportProtocolButton protocolId={protocolId} />` inside the existing `<CardActionSection>`.

- Add to imports (adjust relative depth — file is in `protocol-card-actions/`, target is in `protocol-card/export-protocol-button/`):
```tsx
import { ExportProtocolButton } from "../export-protocol-button";
```
- For `active-actions.tsx` (already receives `protocolId`): add `<ExportProtocolButton protocolId={protocolId} />` as the first child of `<CardActionSection>`.
- For `draft-actions.tsx` and `archived-actions.tsx`: confirm they receive `protocolId` in props. If not, add `protocolId: string` to their `Props` type and pass it from `ProtocolCardActions` (`protocol-card-actions.tsx` already has `protocolId` in scope — forward it to `<DraftActions>` / `<ArchivedActions>`). Then render `<ExportProtocolButton protocolId={protocolId} />` inside their `<CardActionSection>`.

- [ ] **Step 6: Check LSP diagnostics**

Confirm no type/import errors across the modified action files and the new folder. Ensure `protocolId` is threaded into Draft/Archived actions if you added the prop.

- [ ] **Step 7: Lint + full test run**

Run:
```bash
pnpm lint && pnpm test
```
Expected: lint passes; all tests pass.

- [ ] **Step 8: Commit**

```bash
git add "src/features/settings/components/settings-page/protocol-section/protocol-card"
git commit -m "feat: protocol export button in settings card actions"
```

---

## Task 9: Final verification

- [ ] **Step 1: Typecheck + lint + tests**

Run:
```bash
pnpm lint && pnpm test && pnpm build
```
Expected: all green; build succeeds (verifies route handler + server-external libs bundle correctly).

- [ ] **Step 2: Manual smoke (dev)**

Run `pnpm dev`. Log in, go to `/settings`. On an active protocol card click **Eksportuj** → **Excel**: a `.xlsx` downloads, opens, header rows + table + Polish text correct. Repeat **PDF**: a `.pdf` downloads, Polish glyphs render, critical items highlighted, grouped by time block. Try a draft and an archived protocol (button present, downloads work). Confirm a processing/failed protocol shows no export button (those statuses are not in DraftActions/ActiveActions/ArchivedActions).

- [ ] **Step 3: Manual auth/edge checks**

- Hit `/api/protocol/<someone-elses-id>/export?format=pdf` while logged in → 404.
- Hit `/api/protocol/<id>/export?format=docx` → 400.
- Hit the URL logged out → 401 (or redirected by middleware).

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: protocol export verification follow-ups"
```

---

## Self-Review Notes

- **Spec coverage:** PDF + Excel ✓ (Tasks 4–5); structure-only / no DailyLog ✓ (model has no adherence fields); card action placement ✓ (Task 8); statuses draft/active/archived, processing/failed → 400 ✓ (Task 7 `EXPORTABLE`); `@react-pdf/renderer` + `exceljs` ✓ (Task 1); Route Handler not Server Action ✓ (Task 7); error matrix (401/404/400/empty-ok) ✓ (Task 7 tests + empty-protocol tests in 3/4/5); TDD pure-first ordering ✓ (Tasks 2→3→4→5 before query/route); out-of-scope items excluded ✓.
- **Type consistency:** `ProtocolForExportData` defined in Task 3, produced by Task 6 query (column selection matches field-for-field), consumed by Task 7. `ProtocolExportModel`/`mapToExportRows`/`toExportFilename` consistent across Tasks 2/3/4/5/7.
- **Known judgement call:** query AND route handler have no unit tests — deliberate, matches repo convention (only pure business functions are tested; no existing query/route has a test). Pure logic (mapper, filename, xlsx, pdf) is fully unit-tested; route/query correctness is covered by `tsc --noEmit` + manual smoke (Task 9).
