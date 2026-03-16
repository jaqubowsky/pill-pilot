import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildScheduleEntry } from "./build-schedule-entry";

const NOW = new Date("2025-01-10T12:00:00Z");

const baseRow = {
	scheduleId: "s1",
	dosageAmount: "2",
	dosageUnit: "capsule" as const,
	notes: null,
	sortOrder: 0,
	isCritical: false,
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null,
	dosageIntervalMinutes: null,
	waitAfterTakingMinutes: null,
	supplementId: "sup1",
	supplementName: "Vitamin D",
	supplementBrandName: null,
	supplementCategory: "vitamins",
	currentStock: "100",
	stockUnit: "capsule" as const,
	packageSize: null,
	finishPackage: false,
	protocolStartDate: "2025-01-01",
	protocolId: "p1",
	blockId: "b1",
};

const baseCtx = {
	logMap: new Map(),
	stockForecastMap: new Map<string, number>(),
	date: "2025-01-10",
	siblingTakenAtMap: new Map(),
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("buildScheduleEntry", () => {
	it("builds entry with stock status from string", () => {
		const { entry } = buildScheduleEntry(baseRow, baseCtx);

		expect(entry.stockStatus).toEqual({
			currentStock: 100,
			daysRemaining: Number.POSITIVE_INFINITY,
			stockUnit: "capsule",
		});
	});

	it("returns null stock status when currentStock is null", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, currentStock: null }, baseCtx);

		expect(entry.stockStatus).toBeNull();
	});

	it("sets hasLog false when no log exists", () => {
		const { hasLog } = buildScheduleEntry(baseRow, baseCtx);
		expect(hasLog).toBe(false);
	});

	it("sets hasLog true and populates logId/takenAt when log exists", () => {
		const takenAt = new Date("2025-01-10T08:00:00Z");
		const ctx = {
			...baseCtx,
			logMap: new Map([
				["s1", { id: "log1", takenAt, timerAdjustmentMinutes: null, timerNotifiedAt: null }],
			]),
		};

		const { entry, hasLog } = buildScheduleEntry(baseRow, ctx);

		expect(hasLog).toBe(true);
		expect(entry.logId).toBe("log1");
		expect(entry.takenAt).toEqual(takenAt);
	});

	it("computes notStartedDays when before protocol start", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, protocolStartDate: "2025-01-15" }, baseCtx);

		expect(entry.notStartedDays).toBe(5);
	});

	it("sets notStartedDays null when protocol already started", () => {
		const { entry } = buildScheduleEntry(baseRow, baseCtx);
		expect(entry.notStartedDays).toBeNull();
	});

	it("returns null cooldown when no dosageIntervalMinutes", () => {
		const { entry } = buildScheduleEntry(baseRow, baseCtx);
		expect(entry.cooldown).toBeNull();
	});

	it("returns null cooldown when schedule already has a log", () => {
		const ctx = {
			...baseCtx,
			logMap: new Map([
				[
					"s1",
					{
						id: "log1",
						takenAt: new Date("2025-01-10T08:00:00Z"),
						timerAdjustmentMinutes: null,
						timerNotifiedAt: null,
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, dosageIntervalMinutes: 120 }, ctx);
		expect(entry.cooldown).toBeNull();
	});

	it("computes cooldown from sibling log", () => {
		const siblingTakenAt = new Date("2025-01-10T11:00:00Z");
		const ctx = {
			...baseCtx,
			siblingTakenAtMap: new Map([
				[
					"p1:sup1",
					{
						logId: "sibLog",
						takenAt: siblingTakenAt,
						adjustmentMinutes: 0,
						cooldownSkipped: false,
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, dosageIntervalMinutes: 120 }, ctx);

		expect(entry.cooldown).not.toBeNull();
		expect(entry.cooldown!.logId).toBe("sibLog");
		expect(entry.cooldown!.remainingMs).toBe(60 * 60 * 1000);
	});

	it("returns null cooldown when sibling cooldown was skipped", () => {
		const ctx = {
			...baseCtx,
			siblingTakenAtMap: new Map([
				[
					"p1:sup1",
					{
						logId: "sibLog",
						takenAt: new Date("2025-01-10T11:30:00Z"),
						adjustmentMinutes: 0,
						cooldownSkipped: true,
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, dosageIntervalMinutes: 120 }, ctx);
		expect(entry.cooldown).toBeNull();
	});

	it("applies timer adjustment to cooldown", () => {
		const siblingTakenAt = new Date("2025-01-10T11:00:00Z");
		const ctx = {
			...baseCtx,
			siblingTakenAtMap: new Map([
				[
					"p1:sup1",
					{
						logId: "sibLog",
						takenAt: siblingTakenAt,
						adjustmentMinutes: -30,
						cooldownSkipped: false,
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, dosageIntervalMinutes: 120 }, ctx);

		expect(entry.cooldown!.remainingMs).toBe(30 * 60 * 1000);
	});

	it("returns null wait timer when no waitAfterTakingMinutes", () => {
		const { entry } = buildScheduleEntry(baseRow, baseCtx);
		expect(entry.waitTimer).toBeNull();
	});

	it("returns null wait timer when no log", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, waitAfterTakingMinutes: 30 }, baseCtx);
		expect(entry.waitTimer).toBeNull();
	});

	it("computes wait timer from log takenAt", () => {
		const takenAt = new Date("2025-01-10T11:45:00Z");
		const ctx = {
			...baseCtx,
			logMap: new Map([
				["s1", { id: "log1", takenAt, timerAdjustmentMinutes: null, timerNotifiedAt: null }],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, waitAfterTakingMinutes: 30 }, ctx);

		expect(entry.waitTimer).not.toBeNull();
		expect(entry.waitTimer!.remainingMs).toBe(15 * 60 * 1000);
	});

	it("returns null wait timer when timerNotifiedAt is set", () => {
		const takenAt = new Date("2025-01-10T11:45:00Z");
		const ctx = {
			...baseCtx,
			logMap: new Map([
				[
					"s1",
					{
						id: "log1",
						takenAt,
						timerAdjustmentMinutes: null,
						timerNotifiedAt: new Date("2025-01-10T12:00:00Z"),
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, waitAfterTakingMinutes: 30 }, ctx);
		expect(entry.waitTimer).toBeNull();
	});

	it("returns null cooldown when cooldown has already expired", () => {
		const siblingTakenAt = new Date("2025-01-10T09:00:00Z");
		const ctx = {
			...baseCtx,
			siblingTakenAtMap: new Map([
				[
					"p1:sup1",
					{
						logId: "sibLog",
						takenAt: siblingTakenAt,
						adjustmentMinutes: 0,
						cooldownSkipped: false,
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, dosageIntervalMinutes: 120 }, ctx);
		expect(entry.cooldown).toBeNull();
	});

	it("returns null cooldown when negative adjustment pushes it below zero", () => {
		const siblingTakenAt = new Date("2025-01-10T11:00:00Z");
		const ctx = {
			...baseCtx,
			siblingTakenAtMap: new Map([
				[
					"p1:sup1",
					{
						logId: "sibLog",
						takenAt: siblingTakenAt,
						adjustmentMinutes: -120,
						cooldownSkipped: false,
					},
				],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, dosageIntervalMinutes: 60 }, ctx);
		expect(entry.cooldown).toBeNull();
	});

	it("returns null wait timer when timer has already expired", () => {
		const takenAt = new Date("2025-01-10T10:00:00Z");
		const ctx = {
			...baseCtx,
			logMap: new Map([
				["s1", { id: "log1", takenAt, timerAdjustmentMinutes: null, timerNotifiedAt: null }],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, waitAfterTakingMinutes: 30 }, ctx);
		expect(entry.waitTimer).toBeNull();
	});

	it("uses stockForecastMap value for daysRemaining", () => {
		const ctx = {
			...baseCtx,
			stockForecastMap: new Map([["sup1", 14]]),
		};

		const { entry } = buildScheduleEntry(baseRow, ctx);
		expect(entry.stockStatus!.daysRemaining).toBe(14);
	});

	it("populates cycling field when schedule has cycling params", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, cycleDaysOn: 3, cycleDaysOff: 2 }, baseCtx);

		expect(entry.cycling).toEqual({
			isOnPhase: false,
			daysRemaining: 1,
		});
	});

	it("populates dependency field when startDayOffset > 0 and not yet unlocked", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, startDayOffset: 20 }, baseCtx);

		expect(entry.phase).toEqual({
			isUnlocked: false,
			daysRemaining: 11,
		});
		expect(entry.isExpired).toBe(false);
	});

	it("sets isExpired when past offset + duration", () => {
		const { entry } = buildScheduleEntry(
			{ ...baseRow, startDayOffset: 0, durationDays: 5 },
			baseCtx,
		);

		expect(entry.isExpired).toBe(true);
		expect(entry.phase).toBeNull();
	});

	it("returns null wait timer when negative adjustment causes expiry", () => {
		const takenAt = new Date("2025-01-10T11:30:00Z");
		const ctx = {
			...baseCtx,
			logMap: new Map([
				["s1", { id: "log1", takenAt, timerAdjustmentMinutes: -30, timerNotifiedAt: null }],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, waitAfterTakingMinutes: 20 }, ctx);
		expect(entry.waitTimer).toBeNull();
	});

	it("passes through packageSize", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, packageSize: 90 }, baseCtx);
		expect(entry.packageSize).toBe(90);
	});

	it("passes through null packageSize", () => {
		const { entry } = buildScheduleEntry(baseRow, baseCtx);
		expect(entry.packageSize).toBeNull();
	});

	it("passes through finishPackage flag", () => {
		const { entry } = buildScheduleEntry({ ...baseRow, finishPackage: true }, baseCtx);
		expect(entry.finishPackage).toBe(true);
	});

	it("defaults finishPackage to false", () => {
		const { entry } = buildScheduleEntry(baseRow, baseCtx);
		expect(entry.finishPackage).toBe(false);
	});

	it("applies timer adjustment to wait timer", () => {
		const takenAt = new Date("2025-01-10T11:30:00Z");
		const ctx = {
			...baseCtx,
			logMap: new Map([
				["s1", { id: "log1", takenAt, timerAdjustmentMinutes: 10, timerNotifiedAt: null }],
			]),
		};

		const { entry } = buildScheduleEntry({ ...baseRow, waitAfterTakingMinutes: 30 }, ctx);

		expect(entry.waitTimer!.remainingMs).toBe(10 * 60 * 1000);
	});
});
