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
			sortOrder: 0,
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
		expect(flat).toContain("Tak");
	});

	it("handles an empty protocol without throwing", async () => {
		const buf = await buildProtocolXlsx({ ...model, rows: [] });
		expect(buf.length).toBeGreaterThan(0);
	});
});
