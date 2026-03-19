import { describe, expect, it } from "vitest";
import {
	getFirstDayOfWeek,
	getMondayOfWeek,
	isToday,
	parseDate,
	shiftDate,
	shiftYearMonth,
	toDateString,
	toMonthLabel,
	toYearMonth,
} from "./date";

describe("toDateString", () => {
	it("formats date as YYYY-MM-DD", () => {
		const result = toDateString(new Date(2026, 2, 19));
		expect(result).toBe("2026-03-19");
	});

	it("zero-pads month and day", () => {
		const result = toDateString(new Date(2026, 0, 5));
		expect(result).toBe("2026-01-05");
	});
});

describe("parseDate", () => {
	it("parses YYYY-MM-DD into local Date", () => {
		const date = parseDate("2026-03-19");
		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(2);
		expect(date.getDate()).toBe(19);
	});

	it("handles first day of year", () => {
		const date = parseDate("2026-01-01");
		expect(date.getMonth()).toBe(0);
		expect(date.getDate()).toBe(1);
	});

	it("handles last day of year", () => {
		const date = parseDate("2026-12-31");
		expect(date.getMonth()).toBe(11);
		expect(date.getDate()).toBe(31);
	});
});

describe("shiftDate", () => {
	it("shifts forward by days", () => {
		expect(shiftDate("2026-03-19", 1)).toBe("2026-03-20");
		expect(shiftDate("2026-03-19", 7)).toBe("2026-03-26");
	});

	it("shifts backward by days", () => {
		expect(shiftDate("2026-03-19", -1)).toBe("2026-03-18");
	});

	it("crosses month boundary", () => {
		expect(shiftDate("2026-03-31", 1)).toBe("2026-04-01");
	});

	it("crosses year boundary", () => {
		expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
	});

	it("handles zero shift", () => {
		expect(shiftDate("2026-03-19", 0)).toBe("2026-03-19");
	});
});

describe("getMondayOfWeek", () => {
	it("returns Monday for a Wednesday", () => {
		const wed = new Date(2026, 2, 18);
		const monday = getMondayOfWeek(wed);
		expect(monday.getDay()).toBe(1);
		expect(monday.getDate()).toBe(16);
	});

	it("returns same day for Monday", () => {
		const mon = new Date(2026, 2, 16);
		const monday = getMondayOfWeek(mon);
		expect(monday.getDate()).toBe(16);
	});

	it("returns previous Monday for Sunday", () => {
		const sun = new Date(2026, 2, 22);
		expect(sun.getDay()).toBe(0);
		const monday = getMondayOfWeek(sun);
		expect(monday.getDay()).toBe(1);
		expect(monday.getDate()).toBe(16);
	});

	it("does not mutate the input date", () => {
		const original = new Date(2026, 2, 18);
		const originalTime = original.getTime();
		getMondayOfWeek(original);
		expect(original.getTime()).toBe(originalTime);
	});
});

describe("isToday", () => {
	it("returns true for today", () => {
		expect(isToday(new Date())).toBe(true);
	});

	it("returns true regardless of time", () => {
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		expect(isToday(today)).toBe(true);
	});

	it("returns false for yesterday", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		expect(isToday(yesterday)).toBe(false);
	});
});

describe("toYearMonth", () => {
	it("formats as YYYY-MM", () => {
		expect(toYearMonth(new Date(2026, 2, 1))).toBe("2026-03");
	});

	it("zero-pads single digit months", () => {
		expect(toYearMonth(new Date(2026, 0, 15))).toBe("2026-01");
	});

	it("handles December", () => {
		expect(toYearMonth(new Date(2026, 11, 1))).toBe("2026-12");
	});
});

describe("shiftYearMonth", () => {
	it("shifts forward by months", () => {
		expect(shiftYearMonth("2026-03", 1)).toBe("2026-04");
	});

	it("shifts backward by months", () => {
		expect(shiftYearMonth("2026-03", -1)).toBe("2026-02");
	});

	it("crosses year boundary forward", () => {
		expect(shiftYearMonth("2026-12", 1)).toBe("2027-01");
	});

	it("crosses year boundary backward", () => {
		expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
	});

	it("shifts by multiple months", () => {
		expect(shiftYearMonth("2026-03", 10)).toBe("2027-01");
	});
});

describe("toMonthLabel", () => {
	it("capitalizes month name and appends year", () => {
		const label = toMonthLabel("2026-03");
		expect(label).toMatch(/^[A-ZŹŻ]/);
		expect(label).toContain("2026");
	});

	it("handles January", () => {
		const label = toMonthLabel("2026-01");
		expect(label).toContain("2026");
	});
});

describe("getFirstDayOfWeek", () => {
	it("returns 0 for Monday (Mon=0 index)", () => {
		const result = getFirstDayOfWeek("2026-06");
		expect(result).toBe(0);
	});

	it("returns 6 for Sunday", () => {
		const result = getFirstDayOfWeek("2026-03");
		expect(result).toBe(6);
	});

	it("returns correct value for mid-week start", () => {
		const result = getFirstDayOfWeek("2026-04");
		expect(result).toBe(2);
	});
});
