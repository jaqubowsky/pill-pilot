import { describe, expect, it } from "vitest";
import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";
import { collectTimers } from "./collect-timers";

const base: ScheduleEntry = {
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
	timeBlockId: "tb1",
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
};

describe("collectTimers", () => {
	it("returns empty array when no timers present", () => {
		expect(collectTimers([base])).toEqual([]);
	});

	it("collects a cooldown timer", () => {
		const entry = {
			...base,
			cooldown: { remainingMs: 5000, logId: "log1" },
		};
		const timers = collectTimers([entry]);
		expect(timers).toHaveLength(1);
		expect(timers[0]).toMatchObject({
			type: "cooldown",
			remainingMs: 5000,
			supplementName: "Vitamin D",
		});
	});

	it("collects a wait timer", () => {
		const entry = {
			...base,
			waitTimer: { remainingMs: 3000 },
			logId: "log1",
		};
		const timers = collectTimers([entry]);
		expect(timers).toHaveLength(1);
		expect(timers[0]).toMatchObject({ type: "wait", remainingMs: 3000 });
	});

	it("deduplicates cooldowns for same protocol + supplement", () => {
		const entry1 = {
			...base,
			scheduleId: "s1",
			cooldown: { remainingMs: 5000, logId: "log1" },
		};
		const entry2 = {
			...base,
			scheduleId: "s2",
			cooldown: { remainingMs: 3000, logId: "log2" },
		};
		const timers = collectTimers([entry1, entry2]);
		expect(timers).toHaveLength(1);
		expect(timers[0].scheduleId).toBe("s1");
	});

	it("does not deduplicate cooldowns from different protocols", () => {
		const entry1 = {
			...base,
			scheduleId: "s1",
			protocolId: "p1",
			cooldown: { remainingMs: 5000, logId: "log1" },
		};
		const entry2 = {
			...base,
			scheduleId: "s2",
			protocolId: "p2",
			cooldown: { remainingMs: 3000, logId: "log2" },
		};
		const timers = collectTimers([entry1, entry2]);
		expect(timers).toHaveLength(2);
	});

	it("ignores cooldowns with 0 remaining ms", () => {
		const entry = {
			...base,
			cooldown: { remainingMs: 0, logId: "log1" },
		};
		expect(collectTimers([entry])).toHaveLength(0);
	});

	it("ignores wait timers with 0 remaining ms", () => {
		const entry = {
			...base,
			waitTimer: { remainingMs: 0 },
		};
		expect(collectTimers([entry])).toHaveLength(0);
	});

	it("sorts timers by remaining time ascending", () => {
		const entries = [
			{
				...base,
				scheduleId: "s1",
				supplementId: "sup1",
				cooldown: { remainingMs: 8000, logId: "log1" },
			},
			{
				...base,
				scheduleId: "s2",
				supplementId: "sup2",
				cooldown: { remainingMs: 2000, logId: "log2" },
			},
			{
				...base,
				scheduleId: "s3",
				supplementId: "sup3",
				waitTimer: { remainingMs: 5000 },
				logId: "log3",
			},
		];
		const timers = collectTimers(entries);
		expect(timers.map((t) => t.remainingMs)).toEqual([2000, 5000, 8000]);
	});

	it("collects both cooldown and wait timer from same entry", () => {
		const entry = {
			...base,
			cooldown: { remainingMs: 5000, logId: "log1" },
			waitTimer: { remainingMs: 3000 },
			logId: "log1",
		};
		const timers = collectTimers([entry]);
		expect(timers).toHaveLength(2);
		expect(timers.map((t) => t.type)).toEqual(["wait", "cooldown"]);
	});
});
