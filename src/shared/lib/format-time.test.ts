import { describe, expect, it } from "vitest";
import { formatMinutes } from "./format-time";

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
