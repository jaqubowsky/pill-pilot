import { describe, expect, it } from "vitest";
import type { SharedProtocolData, SharedScheduleData } from "../api/queries/get-shared-protocol";
import { buildSharedParsedSupplements, resolveSharedTimeBlocks } from "./resolve-shared-protocol";

const mockRecipientTimeBlocks = [
	{ id: "tb-morning", name: "Rano", startTime: "08:00" },
	{ id: "tb-evening", name: "Wieczór", startTime: "20:00" },
];

function makeSchedule(overrides: Partial<SharedScheduleData> = {}): SharedScheduleData {
	return {
		timeBlockName: "Rano",
		timeBlockIcon: "☀️",
		timeBlockStartTime: "08:00",
		dosageAmount: 1,
		dosageUnit: "capsule",
		notes: null,
		isCritical: false,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: null,
		waitAfterTakingMinutes: null,
		sortOrder: 0,
		finishPackage: false,
		...overrides,
	};
}

describe("resolveSharedTimeBlocks", () => {
	it("maps schedule to existing recipient time block by name+startTime", () => {
		const { timeBlockIdMap, timeBlocksToCreate } = resolveSharedTimeBlocks(
			[makeSchedule({ timeBlockName: "Rano", timeBlockStartTime: "08:00" })],
			mockRecipientTimeBlocks,
		);

		expect(timeBlocksToCreate).toHaveLength(0);
		expect(timeBlockIdMap.get("rano|08:00")).toBe("tb-morning");
	});

	it("is case-insensitive when matching time block names", () => {
		const { timeBlockIdMap } = resolveSharedTimeBlocks(
			[makeSchedule({ timeBlockName: "RANO", timeBlockStartTime: "08:00" })],
			mockRecipientTimeBlocks,
		);

		expect(timeBlockIdMap.get("rano|08:00")).toBe("tb-morning");
	});

	it("creates a temp time block when no match found", () => {
		const { timeBlocksToCreate, timeBlockIdMap } = resolveSharedTimeBlocks(
			[
				makeSchedule({
					timeBlockName: "Południe",
					timeBlockIcon: "🌞",
					timeBlockStartTime: "12:00",
				}),
			],
			mockRecipientTimeBlocks,
		);

		expect(timeBlocksToCreate).toHaveLength(1);
		expect(timeBlocksToCreate[0].name).toBe("Południe");
		expect(timeBlocksToCreate[0].icon).toBe("🌞");
		expect(timeBlocksToCreate[0].startTime).toBe("12:00");
		expect(timeBlockIdMap.get("południe|12:00")).toBe(timeBlocksToCreate[0].tempId);
	});

	it("deduplicates identical time blocks across multiple schedules", () => {
		const { timeBlocksToCreate } = resolveSharedTimeBlocks(
			[
				makeSchedule({ timeBlockName: "Nowy", timeBlockStartTime: "14:00" }),
				makeSchedule({ timeBlockName: "Nowy", timeBlockStartTime: "14:00" }),
			],
			mockRecipientTimeBlocks,
		);

		expect(timeBlocksToCreate).toHaveLength(1);
	});

	it("returns empty map for empty schedule list", () => {
		const { timeBlockIdMap, timeBlocksToCreate } = resolveSharedTimeBlocks(
			[],
			mockRecipientTimeBlocks,
		);

		expect(timeBlockIdMap.size).toBe(0);
		expect(timeBlocksToCreate).toHaveLength(0);
	});
});

describe("buildSharedParsedSupplements", () => {
	const timeBlockIdMap = new Map([["rano|08:00", "tb-morning"]]);

	const sharedSupplements: SharedProtocolData["supplements"] = [
		{
			name: "Vitamin D",
			category: "vitamin",
			stockUnit: "capsule",
			schedules: [makeSchedule({ dosageAmount: 2 })],
		},
	];

	it("maps existingSupplementId from matchedIds", () => {
		const result = buildSharedParsedSupplements(sharedSupplements, ["s-existing"], timeBlockIdMap);

		expect(result[0].existingSupplementId).toBe("s-existing");
	});

	it("sets existingSupplementId to null when no match", () => {
		const result = buildSharedParsedSupplements(sharedSupplements, [null], timeBlockIdMap);

		expect(result[0].existingSupplementId).toBeNull();
	});

	it("resolves timeBlockId via timeBlockIdMap", () => {
		const result = buildSharedParsedSupplements(sharedSupplements, [null], timeBlockIdMap);

		expect(result[0].schedules[0].timeBlockId).toBe("tb-morning");
	});

	it("copies schedule dosage fields from shared data", () => {
		const result = buildSharedParsedSupplements(sharedSupplements, [null], timeBlockIdMap);

		expect(result[0].schedules[0].dosageAmount).toBe(2);
		expect(result[0].schedules[0].dosageUnit).toBe("capsule");
	});

	it("sets supplement-level defaults for non-shared fields", () => {
		const result = buildSharedParsedSupplements(sharedSupplements, [null], timeBlockIdMap);

		expect(result[0].brandName).toBeNull();
		expect(result[0].isCritical).toBe(false);
		expect(result[0].confidence).toBe(1);
	});
});
