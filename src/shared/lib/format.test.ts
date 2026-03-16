import { describe, expect, it } from "vitest";
import { formatQuantity } from "./format";

describe("formatQuantity", () => {
	it("formats integer numbers without decimals", () => {
		expect(formatQuantity(5)).toBe("5");
		expect(formatQuantity(100)).toBe("100");
	});

	it("preserves decimals for fractional numbers", () => {
		expect(formatQuantity(2.5)).toBe("2.5");
		expect(formatQuantity(0.25)).toBe("0.25");
	});

	it("handles string input — integer", () => {
		expect(formatQuantity("10")).toBe("10");
		expect(formatQuantity("10.0")).toBe("10");
	});

	it("handles string input — fractional", () => {
		expect(formatQuantity("2.5")).toBe("2.5");
	});

	it("preserves trailing zeros in string input", () => {
		expect(formatQuantity("2.50")).toBe("2.50");
	});

	it("handles zero", () => {
		expect(formatQuantity(0)).toBe("0");
	});

	it("returns original string for NaN input", () => {
		expect(formatQuantity("abc")).toBe("abc");
	});
});
