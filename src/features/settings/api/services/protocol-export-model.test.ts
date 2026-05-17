import { describe, expect, it } from "vitest";
import {
	mapToExportRows,
	type ProtocolForExportData,
	toExportFilename,
} from "./protocol-export-model";

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
		expect(model.status).toBe("draft");
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
