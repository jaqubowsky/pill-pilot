import { describe, expect, it } from "vitest";
import { formatAmount, formatQuantity } from "./format-currency";

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

describe("formatAmount", () => {
	it("formats with two decimal places and comma", () => {
		expect(formatAmount(29.99)).toBe("29,99");
	});

	it("adds trailing zeros", () => {
		expect(formatAmount(10)).toBe("10,00");
	});

	it("handles small amounts", () => {
		expect(formatAmount(0.5)).toBe("0,50");
	});

	it("handles zero", () => {
		expect(formatAmount(0)).toBe("0,00");
	});

	it("rounds to two decimals", () => {
		expect(formatAmount(1.999)).toBe("2,00");
		expect(formatAmount(1.006)).toBe("1,01");
	});

	it("handles large amounts", () => {
		expect(formatAmount(1234.56)).toBe("1234,56");
	});

	it("handles negative amounts", () => {
		expect(formatAmount(-5.5)).toBe("-5,50");
	});
});
