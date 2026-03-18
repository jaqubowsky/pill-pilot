import { describe, expect, it } from "vitest";
import {
	groupLogsByDate,
	isScheduleActionable,
	type ScheduleFilterFields,
} from "./schedule-filters";

const base: ScheduleFilterFields = {
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null,
	protocolStartDate: "2025-01-01",
};

describe("isScheduleActionable", () => {
	it("returns true for simple active schedule", () => {
		expect(isScheduleActionable(base, "2025-01-15")).toBe(true);
	});

	it("returns false when schedule is expired", () => {
		const schedule = { ...base, durationDays: 7 };
		expect(isScheduleActionable(schedule, "2025-01-20")).toBe(false);
	});

	it("returns false when schedule has not started yet (phase locked)", () => {
		const schedule = { ...base, startDayOffset: 14 };
		expect(isScheduleActionable(schedule, "2025-01-05")).toBe(false);
	});

	it("returns true when schedule phase is unlocked", () => {
		const schedule = { ...base, startDayOffset: 5 };
		expect(isScheduleActionable(schedule, "2025-01-10")).toBe(true);
	});

	it("returns false during cycling off-phase", () => {
		const schedule = { ...base, cycleDaysOn: 3, cycleDaysOff: 2 };
		expect(isScheduleActionable(schedule, "2025-01-04")).toBe(false);
	});

	it("returns true during cycling on-phase", () => {
		const schedule = { ...base, cycleDaysOn: 3, cycleDaysOff: 2 };
		expect(isScheduleActionable(schedule, "2025-01-01")).toBe(true);
	});

	it("returns true when no protocolStartDate", () => {
		const schedule = { ...base, protocolStartDate: null };
		expect(isScheduleActionable(schedule, "2025-06-01")).toBe(true);
	});

	it("returns false when expired even with cycling", () => {
		const schedule = { ...base, cycleDaysOn: 3, cycleDaysOff: 2, durationDays: 5 };
		expect(isScheduleActionable(schedule, "2025-01-20")).toBe(false);
	});
});

describe("groupLogsByDate", () => {
	it("groups logs by date into sets of scheduleIds", () => {
		const logs = [
			{ scheduleId: "s1", date: "2025-01-01" },
			{ scheduleId: "s2", date: "2025-01-01" },
			{ scheduleId: "s1", date: "2025-01-02" },
		];

		const result = groupLogsByDate(logs);

		expect(result.size).toBe(2);
		expect(result.get("2025-01-01")).toEqual(new Set(["s1", "s2"]));
		expect(result.get("2025-01-02")).toEqual(new Set(["s1"]));
	});

	it("returns empty map for empty input", () => {
		expect(groupLogsByDate([]).size).toBe(0);
	});

	it("deduplicates same scheduleId on same date", () => {
		const logs = [
			{ scheduleId: "s1", date: "2025-01-01" },
			{ scheduleId: "s1", date: "2025-01-01" },
		];

		const result = groupLogsByDate(logs);
		expect(result.get("2025-01-01")?.size).toBe(1);
	});
});
