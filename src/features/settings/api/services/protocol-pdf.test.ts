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
			sortOrder: 0,
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
