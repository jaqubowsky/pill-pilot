import { describe, expect, it } from "vitest";
import { calculateConsumedUnits, forecastDaysInStock } from "./stock-forecast";

const schedule = (
	overrides: Partial<{
		dosageAmount: number;
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		startDayOffset: number;
		durationDays: number | null;
		protocolStartDate: string | null;
	}> = {},
) => ({
	dosageAmount: 1,
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null,
	protocolStartDate: "2025-01-01",
	...overrides,
});

describe("forecastDaysInStock", () => {
	it("returns 0 when stock is zero", () => {
		expect(forecastDaysInStock(0, [schedule()], "2025-01-10")).toBe(0);
	});

	it("returns 0 when stock is negative", () => {
		expect(forecastDaysInStock(-5, [schedule()], "2025-01-10")).toBe(0);
	});

	it("returns Infinity when no schedules", () => {
		expect(forecastDaysInStock(100, [], "2025-01-10")).toBe(Number.POSITIVE_INFINITY);
	});

	it("returns Infinity when all schedules are expired", () => {
		const s = schedule({ durationDays: 5, startDayOffset: 0 });
		expect(forecastDaysInStock(100, [s], "2025-02-01")).toBe(Number.POSITIVE_INFINITY);
	});

	it("depletes stock with constant daily consumption", () => {
		const s = schedule({ dosageAmount: 2 });
		expect(forecastDaysInStock(10, [s], "2025-01-10")).toBe(5);
	});

	it("handles multiple schedules consuming same day", () => {
		const s1 = schedule({ dosageAmount: 1 });
		const s2 = schedule({ dosageAmount: 3 });
		expect(forecastDaysInStock(8, [s1, s2], "2025-01-10")).toBe(2);
	});

	it("respects cycling: 3 on / 2 off", () => {
		const s = schedule({ dosageAmount: 1, cycleDaysOn: 3, cycleDaysOff: 2 });
		const result = forecastDaysInStock(6, [s], "2025-01-01");
		expect(result).toBe(8);
	});

	it("respects startDayOffset — no consumption before offset", () => {
		const s = schedule({ dosageAmount: 1, startDayOffset: 5 });
		const result = forecastDaysInStock(3, [s], "2025-01-01");
		expect(result).toBe(8);
	});

	it("respects durationDays — stock outlasts schedule duration", () => {
		const s = schedule({ dosageAmount: 2, durationDays: 3 });
		const result = forecastDaysInStock(10, [s], "2025-01-01");
		expect(result).toBe(730);
	});

	it("respects durationDays — schedule active only within window", () => {
		const withDuration = schedule({ dosageAmount: 1, durationDays: 3 });
		const withoutDuration = schedule({ dosageAmount: 1, durationDays: null });
		const stock = 5;

		const resultWith = forecastDaysInStock(stock, [withDuration], "2025-01-01");
		const resultWithout = forecastDaysInStock(stock, [withoutDuration], "2025-01-01");

		expect(resultWith).toBe(730);
		expect(resultWithout).toBe(5);
	});

	it("handles null protocolStartDate as always-active", () => {
		const s = schedule({ protocolStartDate: null, dosageAmount: 5 });
		expect(forecastDaysInStock(10, [s], "2025-01-10")).toBe(2);
	});

	it("handles fractional dosage amounts", () => {
		const s = schedule({ dosageAmount: 0.5 });
		expect(forecastDaysInStock(5, [s], "2025-01-10")).toBe(10);
	});

	it("handles protocolStartDate in the future relative to today", () => {
		const s = schedule({ protocolStartDate: "2025-01-20", dosageAmount: 1 });
		const result = forecastDaysInStock(3, [s], "2025-01-10");
		expect(result).toBe(13);
	});

	it("returns MAX_FORECAST_DAYS when stock survives entire simulation", () => {
		const s = schedule({ dosageAmount: 0.001 });
		expect(forecastDaysInStock(999, [s], "2025-01-01")).toBe(730);
	});

	it("handles multiple schedules with different cycling patterns", () => {
		const always = schedule({ dosageAmount: 1 });
		const cycling = schedule({ dosageAmount: 1, cycleDaysOn: 1, cycleDaysOff: 1 });
		const result = forecastDaysInStock(6, [always, cycling], "2025-01-01");
		expect(result).toBe(4);
	});

	it("treats durationDays=0 as never consumed", () => {
		const s = schedule({ dosageAmount: 1, durationDays: 0 });
		expect(forecastDaysInStock(10, [s], "2025-01-01")).toBe(Number.POSITIVE_INFINITY);
	});

	it("treats cycleDaysOn=0 and cycleDaysOff=0 as never consumed", () => {
		const s = schedule({ cycleDaysOn: 0, cycleDaysOff: 0 });
		expect(forecastDaysInStock(10, [s], "2025-01-01")).toBe(Number.POSITIVE_INFINITY);
	});

	it("combines cycling + startDayOffset + durationDays", () => {
		const s = schedule({
			dosageAmount: 1,
			cycleDaysOn: 2,
			cycleDaysOff: 1,
			startDayOffset: 3,
			durationDays: 9,
		});
		const result = forecastDaysInStock(6, [s], "2025-01-01");
		expect(result).toBe(11);
	});
});

describe("calculateConsumedUnits", () => {
	it("returns 0 for no schedules", () => {
		expect(calculateConsumedUnits([], 10, "2025-01-15")).toBe(0);
	});

	it("returns 0 for daysAgo <= 0", () => {
		expect(calculateConsumedUnits([schedule()], 0, "2025-01-15")).toBe(0);
		expect(calculateConsumedUnits([schedule()], -3, "2025-01-15")).toBe(0);
	});

	it("sums constant daily consumption over period", () => {
		const s = schedule({ dosageAmount: 2 });
		expect(calculateConsumedUnits([s], 7, "2025-01-15")).toBe(14);
	});

	it("respects cycling within lookback window", () => {
		const s = schedule({ dosageAmount: 1, cycleDaysOn: 1, cycleDaysOff: 1 });
		const result = calculateConsumedUnits([s], 10, "2025-01-11");
		expect(result).toBe(5);
	});

	it("excludes days before protocol start", () => {
		const s = schedule({ protocolStartDate: "2025-01-10" });
		const result = calculateConsumedUnits([s], 10, "2025-01-15");
		expect(result).toBe(5);
	});

	it("handles null protocolStartDate as always-active", () => {
		const s = schedule({ protocolStartDate: null, dosageAmount: 3 });
		expect(calculateConsumedUnits([s], 4, "2025-01-15")).toBe(12);
	});

	it("respects startDayOffset within lookback window", () => {
		const s = schedule({ protocolStartDate: "2025-01-08", startDayOffset: 3 });
		const result = calculateConsumedUnits([s], 10, "2025-01-15");
		expect(result).toBe(4);
	});

	it("respects durationDays expiring within lookback window", () => {
		const s = schedule({ protocolStartDate: "2025-01-01", durationDays: 10 });
		const result = calculateConsumedUnits([s], 15, "2025-01-20");
		expect(result).toBe(6);
	});

	it("returns 0 when protocolStartDate is after the lookback window", () => {
		const s = schedule({ protocolStartDate: "2025-02-01" });
		expect(calculateConsumedUnits([s], 10, "2025-01-15")).toBe(0);
	});
});
