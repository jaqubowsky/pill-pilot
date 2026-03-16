import { describe, expect, it } from "vitest";
import { getCycleStatus } from "./cycling";

describe("getCycleStatus", () => {
	it("returns not cycling when protocolStartDate is null", () => {
		expect(getCycleStatus(null, 3, 2, "2025-01-10")).toEqual({ isCycling: false });
	});

	it("returns not cycling when cycleDaysOn is null", () => {
		expect(getCycleStatus("2025-01-01", null, 2, "2025-01-10")).toEqual({ isCycling: false });
	});

	it("returns not cycling when cycleDaysOff is null", () => {
		expect(getCycleStatus("2025-01-01", 3, null, "2025-01-10")).toEqual({ isCycling: false });
	});

	it("returns on-phase on first day of cycle", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-01")).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 3,
		});
	});

	it("returns on-phase mid-cycle", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-02")).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 2,
		});
	});

	it("returns off-phase after on-days exhausted", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-04")).toEqual({
			isCycling: true,
			isOnPhase: false,
			daysRemaining: 2,
		});
	});

	it("wraps around to new on-phase after full cycle", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-06")).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 3,
		});
	});

	it("returns on-phase with full days when before startDayOffset", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-02", 5)).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 3,
		});
	});

	it("returns on-phase with daysRemaining 1 on last on-day", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-03")).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 1,
		});
	});

	it("treats cycleDaysOff=0 as always on-phase (mid-cycle)", () => {
		expect(getCycleStatus("2025-01-01", 5, 0, "2025-01-08")).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 3,
		});
	});

	it("treats cycleDaysOff=0 as always on-phase (at cycle boundary)", () => {
		expect(getCycleStatus("2025-01-01", 5, 0, "2025-01-06")).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 5,
		});
	});

	it("handles daysSinceStart exactly 0 (cycle starts today)", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-04", 3)).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 3,
		});
	});

	it("applies startDayOffset to cycle start", () => {
		expect(getCycleStatus("2025-01-01", 3, 2, "2025-01-06", 3)).toEqual({
			isCycling: true,
			isOnPhase: true,
			daysRemaining: 1,
		});
	});

	it("treats cycleDaysOn=0 and cycleDaysOff=0 as not cycling", () => {
		expect(getCycleStatus("2025-01-01", 0, 0, "2025-01-05")).toEqual({
			isCycling: false,
		});
	});
});
