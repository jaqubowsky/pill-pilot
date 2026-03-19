import { describe, expect, it } from "vitest";
import type { ScheduleEntry } from "../api/queries/get-daily-status";
import {
	buildSiblingTakenAtMap,
	buildStockForecastMap,
	buildTotalDailyDosageMap,
	countActionable,
	filterVisibleEntries,
} from "./build-daily-context";

const schedule = (supplementId: string, dosageAmount = "1", overrides = {}) => ({
	scheduleId: `sched-${supplementId}`,
	supplementId,
	protocolId: "p1",
	dosageAmount,
	currentStock: "30",
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null,
	protocolStartDate: "2025-01-01",
	dosageIntervalMinutes: null as number | null,
	...overrides,
});

describe("buildStockForecastMap", () => {
	it("calculates forecast for supplements with stock", () => {
		const result = buildStockForecastMap([schedule("s1", "2")], "2025-03-01");
		expect(result.get("s1")).toBe(15);
	});

	it("skips supplements with null stock", () => {
		const result = buildStockForecastMap(
			[schedule("s1", "1", { currentStock: null })],
			"2025-03-01",
		);
		expect(result.has("s1")).toBe(false);
	});

	it("aggregates multiple schedules for same supplement", () => {
		const result = buildStockForecastMap(
			[schedule("s1", "1", { scheduleId: "sc1" }), schedule("s1", "1", { scheduleId: "sc2" })],
			"2025-03-01",
		);
		expect(result.get("s1")).toBe(15);
	});
});

describe("buildTotalDailyDosageMap", () => {
	it("sums dosage per supplement", () => {
		const result = buildTotalDailyDosageMap([
			schedule("s1", "2", { scheduleId: "sc1" }),
			schedule("s1", "3", { scheduleId: "sc2" }),
			schedule("s2", "1"),
		]);
		expect(result.get("s1")).toBe(5);
		expect(result.get("s2")).toBe(1);
	});

	it("returns empty map for no schedules", () => {
		expect(buildTotalDailyDosageMap([]).size).toBe(0);
	});
});

describe("buildSiblingTakenAtMap", () => {
	it("returns empty map when no schedules have dosageIntervalMinutes", () => {
		const logMap = new Map();
		const result = buildSiblingTakenAtMap([schedule("s1")], logMap);
		expect(result.size).toBe(0);
	});

	it("maps most recent log per protocol:supplement pair", () => {
		const earlier = new Date("2025-03-01T08:00:00");
		const later = new Date("2025-03-01T12:00:00");

		const logMap = new Map([
			[
				"sc1",
				{
					id: "log1",
					scheduleId: "sc1",
					takenAt: earlier,
					timerAdjustmentMinutes: null,
					cooldownSkippedAt: null,
				},
			],
			[
				"sc2",
				{
					id: "log2",
					scheduleId: "sc2",
					takenAt: later,
					timerAdjustmentMinutes: 15,
					cooldownSkippedAt: null,
				},
			],
		]);

		const result = buildSiblingTakenAtMap(
			[
				schedule("s1", "1", { scheduleId: "sc1", dosageIntervalMinutes: 120 }),
				schedule("s1", "1", { scheduleId: "sc2", dosageIntervalMinutes: 120 }),
			],
			logMap,
		);

		const entry = result.get("p1:s1");
		expect(entry?.logId).toBe("log2");
		expect(entry?.adjustmentMinutes).toBe(15);
	});

	it("marks cooldownSkipped when cooldownSkippedAt is set", () => {
		const logMap = new Map([
			[
				"sc1",
				{
					id: "log1",
					scheduleId: "sc1",
					takenAt: new Date(),
					timerAdjustmentMinutes: null,
					cooldownSkippedAt: new Date(),
				},
			],
		]);

		const result = buildSiblingTakenAtMap(
			[schedule("s1", "1", { scheduleId: "sc1", dosageIntervalMinutes: 60 })],
			logMap,
		);

		expect(result.get("p1:s1")?.cooldownSkipped).toBe(true);
	});

	it("skips schedules without matching log", () => {
		const logMap = new Map();
		const result = buildSiblingTakenAtMap(
			[schedule("s1", "1", { dosageIntervalMinutes: 60 })],
			logMap,
		);
		expect(result.size).toBe(0);
	});
});

const block = { blockId: "b1", blockName: "Morning", blockIcon: "sun", startTime: "08:00", blockSortOrder: 0 };

const entry = (overrides: Partial<ScheduleEntry> = {}): ScheduleEntry => ({
	scheduleId: "s1",
	dosageAmount: "1",
	dosageUnit: "capsule",
	notes: null,
	sortOrder: 0,
	supplementId: "sup1",
	supplementName: "Vitamin D",
	supplementBrandName: null,
	supplementCategory: "supplement",
	isCritical: false,
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null,
	timeBlockId: "b1",
	stockStatus: null,
	logId: null,
	takenAt: null,
	cycling: null,
	phase: null,
	isExpired: false,
	notStartedDays: null,
	protocolId: "p1",
	dosageIntervalMinutes: null,
	waitAfterTakingMinutes: null,
	cooldown: null,
	waitTimer: null,
	packageSize: null,
	finishPackage: false,
	totalDailyDosage: 1,
	...overrides,
});

describe("filterVisibleEntries", () => {
	it("keeps entries with null notStartedDays", () => {
		const result = filterVisibleEntries([
			{ block, entry: entry(), hasLog: false },
		]);
		expect(result).toHaveLength(1);
	});

	it("filters out entries with notStartedDays > 0 and no log", () => {
		const result = filterVisibleEntries([
			{ block, entry: entry({ notStartedDays: 5 }), hasLog: false },
		]);
		expect(result).toHaveLength(0);
	});

	it("keeps entries with notStartedDays > 0 if they have a log", () => {
		const result = filterVisibleEntries([
			{ block, entry: entry({ notStartedDays: 5 }), hasLog: true },
		]);
		expect(result).toHaveLength(1);
	});
});

describe("countActionable", () => {
	it("counts active entries", () => {
		const result = countActionable([
			{ block, entry: entry(), hasLog: false },
			{ block, entry: entry({ scheduleId: "s2" }), hasLog: true },
		]);
		expect(result.totalSchedules).toBe(2);
		expect(result.completedCount).toBe(1);
	});

	it("excludes expired entries", () => {
		const result = countActionable([
			{ block, entry: entry({ isExpired: true }), hasLog: true },
		]);
		expect(result.totalSchedules).toBe(0);
		expect(result.completedCount).toBe(0);
	});

	it("excludes locked phase entries", () => {
		const result = countActionable([
			{ block, entry: entry({ phase: { isUnlocked: false, daysRemaining: 3 } }), hasLog: false },
		]);
		expect(result.totalSchedules).toBe(0);
	});

	it("excludes cycling off-phase entries", () => {
		const result = countActionable([
			{ block, entry: entry({ cycling: { isOnPhase: false, daysRemaining: 2 } }), hasLog: false },
		]);
		expect(result.totalSchedules).toBe(0);
	});

	it("includes cycling on-phase entries", () => {
		const result = countActionable([
			{ block, entry: entry({ cycling: { isOnPhase: true, daysRemaining: 2 } }), hasLog: true },
		]);
		expect(result.totalSchedules).toBe(1);
		expect(result.completedCount).toBe(1);
	});
});
