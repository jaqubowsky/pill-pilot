import { describe, expect, it } from "vitest";
import { dashboardSearchParams, monthlySearchParams, weeklySearchParams } from "./search-params";

describe("search-params defaults are empty strings (not computed dates)", () => {
	it("dashboardSearchParams.date defaults to empty string", () => {
		expect(dashboardSearchParams.date.defaultValue).toBe("");
	});

	it("weeklySearchParams.start defaults to empty string", () => {
		expect(weeklySearchParams.start.defaultValue).toBe("");
	});

	it("monthlySearchParams.month defaults to empty string", () => {
		expect(monthlySearchParams.month.defaultValue).toBe("");
	});
});
