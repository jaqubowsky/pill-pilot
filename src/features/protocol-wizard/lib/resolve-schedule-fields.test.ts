import { describe, expect, it } from "vitest";
import { resolveScheduleFields } from "./resolve-schedule-fields";

const baseItem = {
	notes: "item notes",
	isCritical: false,
	cycleDaysOn: 5,
	cycleDaysOff: 2,
	startDayOffset: 3,
	durationDays: 14,
	dosageIntervalMinutes: 120,
	waitAfterTakingMinutes: 30,
};

describe("resolveScheduleFields", () => {
	it("schedule-level values take priority over item-level", () => {
		const result = resolveScheduleFields(
			{ notes: "schedule notes", isCritical: true, startDayOffset: 7 },
			baseItem,
		);

		expect(result.notes).toBe("schedule notes");
		expect(result.isCritical).toBe(true);
		expect(result.startDayOffset).toBe(7);
	});

	it("falls back to item-level when schedule-level is undefined", () => {
		const result = resolveScheduleFields({}, baseItem);

		expect(result.notes).toBe("item notes");
		expect(result.isCritical).toBe(false);
		expect(result.startDayOffset).toBe(3);
		expect(result.durationDays).toBe(14);
		expect(result.dosageIntervalMinutes).toBe(120);
		expect(result.waitAfterTakingMinutes).toBe(30);
	});

	it("defaults startDayOffset to 0 when absent at both levels", () => {
		const result = resolveScheduleFields({}, { ...baseItem, startDayOffset: undefined });
		expect(result.startDayOffset).toBe(0);
	});

	it("defaults notes to null when absent at both levels", () => {
		const result = resolveScheduleFields({}, { ...baseItem, notes: undefined });
		expect(result.notes).toBeNull();
	});

	it("requires both cycleDaysOn AND cycleDaysOff to enable cycling", () => {
		const result = resolveScheduleFields({}, baseItem);
		expect(result.cycleDaysOn).toBe(5);
		expect(result.cycleDaysOff).toBe(2);
	});

	it("rejects partial cycling — only cycleDaysOn set", () => {
		const result = resolveScheduleFields(
			{ cycleDaysOn: 3 },
			{ ...baseItem, cycleDaysOn: null, cycleDaysOff: null },
		);
		expect(result.cycleDaysOn).toBeNull();
		expect(result.cycleDaysOff).toBeNull();
	});

	it("rejects partial cycling — only cycleDaysOff set", () => {
		const result = resolveScheduleFields(
			{ cycleDaysOff: 2 },
			{ ...baseItem, cycleDaysOn: null, cycleDaysOff: null },
		);
		expect(result.cycleDaysOn).toBeNull();
		expect(result.cycleDaysOff).toBeNull();
	});

	it("resolves cycling from mixed levels (on from schedule, off from item)", () => {
		const result = resolveScheduleFields({ cycleDaysOn: 7 }, { ...baseItem, cycleDaysOn: null });
		expect(result.cycleDaysOn).toBe(7);
		expect(result.cycleDaysOff).toBe(2);
	});

	it("explicit null isCritical falls back to item level", () => {
		const result = resolveScheduleFields({ isCritical: null }, { ...baseItem, isCritical: true });
		expect(result.isCritical).toBe(true);
	});

	it("dosageIntervalMinutes comes only from item level", () => {
		const result = resolveScheduleFields({}, baseItem);
		expect(result.dosageIntervalMinutes).toBe(120);
	});

	it("returns null dosageIntervalMinutes when item has none", () => {
		const result = resolveScheduleFields({}, { ...baseItem, dosageIntervalMinutes: undefined });
		expect(result.dosageIntervalMinutes).toBeNull();
	});
});
