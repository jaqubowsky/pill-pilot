import { describe, expect, it } from "vitest";
import { formatRemainingTime } from "./format-remaining-time";

describe("formatRemainingTime", () => {
	it("returns '0 min' for zero", () => {
		expect(formatRemainingTime(0)).toBe("0 min");
	});

	it("returns '0 min' for negative", () => {
		expect(formatRemainingTime(-5000)).toBe("0 min");
	});

	it("formats seconds only", () => {
		expect(formatRemainingTime(45_000)).toBe("45s");
	});

	it("formats minutes and seconds as mm:ss", () => {
		expect(formatRemainingTime(5 * 60_000 + 5_000)).toBe("5:05");
	});

	it("formats exact minutes", () => {
		expect(formatRemainingTime(30 * 60_000)).toBe("30 min");
	});

	it("formats hours only", () => {
		expect(formatRemainingTime(2 * 3_600_000)).toBe("2h");
	});

	it("formats hours and minutes", () => {
		expect(formatRemainingTime(2 * 3_600_000 + 15 * 60_000)).toBe("2h 15 min");
	});

	it("formats exactly 1 minute", () => {
		expect(formatRemainingTime(60_000)).toBe("1 min");
	});

	it("formats exactly 1 hour", () => {
		expect(formatRemainingTime(3_600_000)).toBe("1h");
	});

	it("rounds up partial seconds", () => {
		expect(formatRemainingTime(500)).toBe("1s");
	});

	it("drops trailing seconds when hours are present", () => {
		expect(formatRemainingTime(3_600_000 + 30_000)).toBe("1h");
	});
});
