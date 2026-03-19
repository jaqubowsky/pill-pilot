import { describe, expect, it } from "vitest";
import { getActiveKey } from "./view-switcher";

describe("getActiveKey", () => {
	it("returns 'day' for /dashboard", () => {
		expect(getActiveKey("/dashboard")).toBe("day");
	});

	it("returns 'week' for /dashboard/weekly", () => {
		expect(getActiveKey("/dashboard/weekly")).toBe("week");
	});

	it("returns 'month' for /dashboard/monthly", () => {
		expect(getActiveKey("/dashboard/monthly")).toBe("month");
	});

	it("returns 'day' for /dashboard with search params", () => {
		expect(getActiveKey("/dashboard?date=2025-01-01")).toBe("day");
	});

	it("returns 'week' for /dashboard/weekly with search params", () => {
		expect(getActiveKey("/dashboard/weekly?start=2025-01-06")).toBe("week");
	});

	it("returns 'month' for /dashboard/monthly with search params", () => {
		expect(getActiveKey("/dashboard/monthly?month=2025-01")).toBe("month");
	});
});
