import { describe, expect, it } from "vitest";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import {
	buildDefaultSupplement,
	findPackageSize,
	findScheduleIndex,
	getTotalDailyDosage,
} from "./supplement-defaults";

describe("findPackageSize", () => {
	const supplements = [
		{ id: "s1", name: "Vitamin D", brandName: null, packageSize: 60 },
		{ id: "s2", name: "Magnesium", brandName: null, packageSize: null },
	];

	it("returns packageSize for matching supplement", () => {
		expect(findPackageSize("s1", supplements)).toBe(60);
	});

	it("returns null when no existingSupplementId", () => {
		expect(findPackageSize(null, supplements)).toBeNull();
	});

	it("returns null when supplement not found", () => {
		expect(findPackageSize("s99", supplements)).toBeNull();
	});

	it("returns null when supplement has no packageSize", () => {
		expect(findPackageSize("s2", supplements)).toBeNull();
	});
});

describe("findScheduleIndex", () => {
	const schedules = [{ timeBlockId: "tb-morning" }, { timeBlockId: "tb-evening" }];

	it("returns index of matching timeBlockId", () => {
		expect(findScheduleIndex(schedules, "tb-evening")).toBe(1);
	});

	it("returns -1 when not found", () => {
		expect(findScheduleIndex(schedules, "tb-lunch")).toBe(-1);
	});

	it("returns first match when duplicates exist", () => {
		const dupes = [{ timeBlockId: "tb-a" }, { timeBlockId: "tb-a" }];
		expect(findScheduleIndex(dupes, "tb-a")).toBe(0);
	});
});

describe("getTotalDailyDosage", () => {
	it("sums dosageAmount across schedules", () => {
		expect(getTotalDailyDosage([{ dosageAmount: 1 }, { dosageAmount: 2.5 }])).toBe(3.5);
	});

	it("returns 0 for empty schedules", () => {
		expect(getTotalDailyDosage([])).toBe(0);
	});

	it("handles single schedule", () => {
		expect(getTotalDailyDosage([{ dosageAmount: 5 }])).toBe(5);
	});
});

describe("buildDefaultSupplement", () => {
	it("creates a supplement with the given timeBlockId", () => {
		const result = buildDefaultSupplement("tb-morning");

		expect(result.schedules).toHaveLength(1);
		expect(result.schedules[0].timeBlockId).toBe("tb-morning");
	});

	it("uses supplement category and capsule dosage unit as defaults", () => {
		const result = buildDefaultSupplement("tb1");

		expect(result.category).toBe(SupplementCategory.supplement);
		expect(result.schedules[0].dosageUnit).toBe(DosageUnit.capsule);
		expect(result.schedules[0].dosageAmount).toBe(1);
	});

	it("sets confidence to 1 (manual entry = full confidence)", () => {
		const result = buildDefaultSupplement("tb1");

		expect(result.confidence).toBe(1);
	});

	it("sets all optional fields to null/defaults", () => {
		const result = buildDefaultSupplement("tb1");

		expect(result.name).toBe("");
		expect(result.existingSupplementId).toBeNull();
		expect(result.brandName).toBeNull();
		expect(result.notes).toBeNull();
		expect(result.cycleDaysOn).toBeNull();
		expect(result.cycleDaysOff).toBeNull();
		expect(result.startDayOffset).toBe(0);
		expect(result.durationDays).toBeNull();
		expect(result.dosageIntervalMinutes).toBeNull();
		expect(result.waitAfterTakingMinutes).toBeNull();
	});
});
