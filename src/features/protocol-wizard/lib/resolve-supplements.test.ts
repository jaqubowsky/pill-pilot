import { describe, expect, it } from "vitest";
import { ActionError } from "@/shared/lib/safe-action";
import { buildScheduleDataList, type ResolvedSupplement } from "./resolve-supplements";

const supplement = (name: string, overrides = {}) => ({
	name,
	brandName: null,
	category: "supplement" as const,
	confidence: 1,
	existingSupplementId: null,
	isCritical: false,
	notes: null,
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: null,
	durationDays: null,
	dosageIntervalMinutes: null,
	waitAfterTakingMinutes: null,
	schedules: [
		{
			timeBlockId: "tb1",
			dosageAmount: 1,
			dosageUnit: "capsule" as const,
			notes: null,
			isCritical: null,
			cycleDaysOn: null,
			cycleDaysOff: null,
			startDayOffset: null,
			durationDays: null,
			waitAfterTakingMinutes: null,
			finishPackage: null,
		},
	],
	...overrides,
});

const supplementMap: Record<string, ResolvedSupplement> = {
	"Vitamin D": { supplementId: "s1", isNew: true },
	Magnesium: { supplementId: "s2", isNew: false },
};

const validTimeBlockIds = new Set(["tb1", "tb2"]);

describe("buildScheduleDataList", () => {
	it("builds schedule data from parsed supplements", () => {
		const result = buildScheduleDataList(
			[supplement("Vitamin D")],
			supplementMap,
			"p1",
			validTimeBlockIds,
		);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			protocolId: "p1",
			supplementId: "s1",
			timeBlockId: "tb1",
			dosageAmount: "1",
			dosageUnit: "capsule",
			sortOrder: 0,
		});
	});

	it("assigns incrementing sortOrder across supplements", () => {
		const result = buildScheduleDataList(
			[
				supplement("Vitamin D"),
				supplement("Magnesium", {
					schedules: [
						{
							timeBlockId: "tb2",
							dosageAmount: 2,
							dosageUnit: "capsule",
							notes: null,
							isCritical: null,
							cycleDaysOn: null,
							cycleDaysOff: null,
							startDayOffset: null,
							durationDays: null,
							waitAfterTakingMinutes: null,
							finishPackage: null,
						},
					],
				}),
			],
			supplementMap,
			"p1",
			validTimeBlockIds,
		);

		expect(result).toHaveLength(2);
		expect(result[0].sortOrder).toBe(0);
		expect(result[1].sortOrder).toBe(1);
	});

	it("throws when timeBlockId is not valid", () => {
		const invalidSupplement = supplement("Vitamin D", {
			schedules: [
				{
					timeBlockId: "invalid",
					dosageAmount: 1,
					dosageUnit: "capsule",
					notes: null,
					isCritical: null,
					cycleDaysOn: null,
					cycleDaysOff: null,
					startDayOffset: null,
					durationDays: null,
					waitAfterTakingMinutes: null,
					finishPackage: null,
				},
			],
		});

		expect(() =>
			buildScheduleDataList([invalidSupplement], supplementMap, "p1", validTimeBlockIds),
		).toThrow(ActionError);
	});

	it("resolves schedule-level fields over item-level", () => {
		const result = buildScheduleDataList(
			[
				supplement("Vitamin D", {
					notes: "item note",
					isCritical: true,
					schedules: [
						{
							timeBlockId: "tb1",
							dosageAmount: 1,
							dosageUnit: "capsule",
							notes: "schedule note",
							isCritical: false,
							cycleDaysOn: null,
							cycleDaysOff: null,
							startDayOffset: null,
							durationDays: null,
							waitAfterTakingMinutes: null,
							finishPackage: null,
						},
					],
				}),
			],
			supplementMap,
			"p1",
			validTimeBlockIds,
		);

		expect(result[0].notes).toBe("schedule note");
		expect(result[0].isCritical).toBe(false);
	});

	it("returns empty array for empty supplements", () => {
		expect(buildScheduleDataList([], supplementMap, "p1", validTimeBlockIds)).toEqual([]);
	});

	it("handles multiple schedules per supplement", () => {
		const result = buildScheduleDataList(
			[
				supplement("Vitamin D", {
					schedules: [
						{
							timeBlockId: "tb1",
							dosageAmount: 1,
							dosageUnit: "capsule",
							notes: null,
							isCritical: null,
							cycleDaysOn: null,
							cycleDaysOff: null,
							startDayOffset: null,
							durationDays: null,
							waitAfterTakingMinutes: null,
							finishPackage: null,
						},
						{
							timeBlockId: "tb2",
							dosageAmount: 2,
							dosageUnit: "capsule",
							notes: null,
							isCritical: null,
							cycleDaysOn: null,
							cycleDaysOff: null,
							startDayOffset: null,
							durationDays: null,
							waitAfterTakingMinutes: null,
							finishPackage: null,
						},
					],
				}),
			],
			supplementMap,
			"p1",
			validTimeBlockIds,
		);

		expect(result).toHaveLength(2);
		expect(result[0].timeBlockId).toBe("tb1");
		expect(result[1].timeBlockId).toBe("tb2");
	});
});
