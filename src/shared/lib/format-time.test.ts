import { describe, expect, it } from "vitest";
import { combineToMinutes, formatMinutes, splitMinutes } from "./format-time";

describe("formatMinutes", () => {
	it("formats minutes only", () => {
		expect(formatMinutes(45)).toBe("45 min");
	});

	it("formats exact hours", () => {
		expect(formatMinutes(120)).toBe("2h");
	});

	it("formats hours and minutes", () => {
		expect(formatMinutes(195)).toBe("3h 15 min");
	});

	it("formats zero", () => {
		expect(formatMinutes(0)).toBe("0 min");
	});
});

describe("splitMinutes", () => {
	it("splits zero", () => {
		expect(splitMinutes(0)).toEqual({ hours: 0, mins: 0 });
	});

	it("splits minutes only", () => {
		expect(splitMinutes(45)).toEqual({ hours: 0, mins: 45 });
	});

	it("splits exact hours", () => {
		expect(splitMinutes(120)).toEqual({ hours: 2, mins: 0 });
	});

	it("splits hours and minutes", () => {
		expect(splitMinutes(195)).toEqual({ hours: 3, mins: 15 });
	});
});

describe("combineToMinutes", () => {
	it("combines hours and minutes", () => {
		expect(combineToMinutes(2, 30)).toBe(150);
	});

	it("clamps hours to 0-23", () => {
		expect(combineToMinutes(25, 0)).toBe(23 * 60);
		expect(combineToMinutes(-1, 30)).toBe(30);
	});

	it("clamps minutes to 0-59", () => {
		expect(combineToMinutes(1, 70)).toBe(119);
		expect(combineToMinutes(1, -5)).toBe(60);
	});

	it("enforces min option", () => {
		expect(combineToMinutes(0, 0, { min: 1 })).toBe(1);
		expect(combineToMinutes(0, 0, { min: 5 })).toBe(5);
	});

	it("does not enforce min when result is above it", () => {
		expect(combineToMinutes(1, 0, { min: 1 })).toBe(60);
	});
});
