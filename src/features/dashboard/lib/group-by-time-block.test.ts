import { describe, expect, it } from "vitest";
import type { ScheduleEntry } from "../api/queries/get-daily-status";
import { groupByTimeBlock } from "./group-by-time-block";

const entry = (overrides: Partial<ScheduleEntry> = {}): ScheduleEntry => ({
	scheduleId: "s1",
	dosageAmount: "1",
	dosageUnit: "caps",
	notes: null,
	sortOrder: 0,
	supplementId: "sup1",
	supplementName: "Vitamin D",
	supplementBrandName: null,
	supplementCategory: "vitamins",
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
	...overrides,
});

const block = (id: string, sortOrder: string) => ({
	blockId: id,
	blockName: `Block ${id}`,
	blockIcon: "pill",
	startTime: "08:00",
	blockSortOrder: sortOrder,
});

describe("groupByTimeBlock", () => {
	it("groups entries into their time blocks", () => {
		const result = groupByTimeBlock([
			{ block: block("b1", "1"), entry: entry({ scheduleId: "s1" }), hasLog: false },
			{ block: block("b1", "1"), entry: entry({ scheduleId: "s2" }), hasLog: false },
			{ block: block("b2", "2"), entry: entry({ scheduleId: "s3" }), hasLog: false },
		]);

		expect(result).toHaveLength(2);
		expect(result[0].entries).toHaveLength(2);
		expect(result[1].entries).toHaveLength(1);
	});

	it("sorts blocks by sortOrder", () => {
		const result = groupByTimeBlock([
			{ block: block("b2", "2"), entry: entry(), hasLog: false },
			{ block: block("b1", "1"), entry: entry({ scheduleId: "s2" }), hasLog: false },
		]);

		expect(result[0].blockId).toBe("b1");
		expect(result[1].blockId).toBe("b2");
	});

	it("sorts entries: critical first, then by sortOrder", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ scheduleId: "s1", isCritical: false, sortOrder: 0 }),
				hasLog: false,
			},
			{
				block: block("b1", "1"),
				entry: entry({ scheduleId: "s2", isCritical: true, sortOrder: 5 }),
				hasLog: false,
			},
			{
				block: block("b1", "1"),
				entry: entry({ scheduleId: "s3", isCritical: false, sortOrder: 1 }),
				hasLog: false,
			},
		]);

		const ids = result[0].entries.map((e) => e.scheduleId);
		expect(ids).toEqual(["s2", "s1", "s3"]);
	});

	it("counts actionable entries (not expired, not locked, on-phase, no cooldown)", () => {
		const result = groupByTimeBlock([
			{ block: block("b1", "1"), entry: entry(), hasLog: false },
			{
				block: block("b1", "1"),
				entry: entry({ scheduleId: "s2", isExpired: true }),
				hasLog: false,
			},
			{
				block: block("b1", "1"),
				entry: entry({
					scheduleId: "s3",
					phase: { isUnlocked: false, daysRemaining: 5 },
				}),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(1);
	});

	it("counts completed as actionable entries with logs", () => {
		const result = groupByTimeBlock([
			{ block: block("b1", "1"), entry: entry(), hasLog: true },
			{
				block: block("b1", "1"),
				entry: entry({ scheduleId: "s2" }),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(2);
		expect(result[0].completedCount).toBe(1);
	});

	it("does not count expired entries as completed even with log", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ isExpired: true }),
				hasLog: true,
			},
		]);

		expect(result[0].actionableCount).toBe(0);
		expect(result[0].completedCount).toBe(0);
	});

	it("treats cycling off-phase as not actionable", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ cycling: { isOnPhase: false, daysRemaining: 2 } }),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(0);
	});

	it("returns empty array for empty input", () => {
		expect(groupByTimeBlock([])).toEqual([]);
	});

	it("treats cycling on-phase as actionable", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ cycling: { isOnPhase: true, daysRemaining: 2 } }),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(1);
	});

	it("treats unlocked dependency as actionable", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ phase: { isUnlocked: true, daysRemaining: 0 } }),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(1);
	});

	it("does not count non-actionable entry with log as completed", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({
					cycling: { isOnPhase: false, daysRemaining: 1 },
				}),
				hasLog: true,
			},
		]);

		expect(result[0].completedCount).toBe(0);
		expect(result[0].actionableCount).toBe(0);
	});

	it("treats not-started schedule as not actionable", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ notStartedDays: 5 }),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(0);
	});

	it("treats active cooldown as not actionable", () => {
		const result = groupByTimeBlock([
			{
				block: block("b1", "1"),
				entry: entry({ cooldown: { remainingMs: 5000, logId: "log1" } }),
				hasLog: false,
			},
		]);

		expect(result[0].actionableCount).toBe(0);
	});
});
