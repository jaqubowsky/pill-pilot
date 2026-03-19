import { describe, expect, it } from "vitest";
import { buildStockList } from "./build-stock-list";

const row = (id: string, overrides = {}) => ({
	id,
	name: `Supplement ${id}`,
	brandName: null,
	shopId: null,
	category: "supplement",
	stockUnit: "capsule",
	isCritical: false,
	currentStock: "30",
	packageSize: 60,
	packagePrice: null,
	dailyUsage: 1,
	...overrides,
});

const schedule = (supplementId: string, dosageAmount = 1) => ({
	supplementId,
	dosageAmount,
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null,
	protocolStartDate: "2025-01-01",
});

describe("buildStockList", () => {
	it("splits into tracked and untracked by currentStock", () => {
		const result = buildStockList(
			[row("s1", { currentStock: "10" }), row("s2", { currentStock: null })],
			[schedule("s1")],
			"2025-03-01",
		);

		expect(result.tracked).toHaveLength(1);
		expect(result.tracked[0].id).toBe("s1");
		expect(result.untracked).toHaveLength(1);
		expect(result.untracked[0].id).toBe("s2");
	});

	it("sorts tracked by daysInStock ascending", () => {
		const result = buildStockList(
			[row("s1", { currentStock: "100" }), row("s2", { currentStock: "5" })],
			[schedule("s1"), schedule("s2")],
			"2025-03-01",
		);

		expect(result.tracked[0].id).toBe("s2");
		expect(result.tracked[1].id).toBe("s1");
	});

	it("calculates daysInStock for tracked items", () => {
		const result = buildStockList(
			[row("s1", { currentStock: "10" })],
			[schedule("s1", 2)],
			"2025-03-01",
		);

		expect(result.tracked[0].daysInStock).toBe(5);
	});

	it("returns daysInStock 0 for untracked items", () => {
		const result = buildStockList([row("s1", { currentStock: null })], [], "2025-03-01");

		expect(result.untracked[0].daysInStock).toBe(0);
	});

	it("handles empty input", () => {
		const result = buildStockList([], [], "2025-03-01");
		expect(result.tracked).toEqual([]);
		expect(result.untracked).toEqual([]);
	});

	it("breaks daysInStock tie by stock percentage ascending", () => {
		const result = buildStockList(
			[
				row("s1", { currentStock: "30", packageSize: 60 }),
				row("s2", { currentStock: "30", packageSize: 120 }),
			],
			[schedule("s1"), schedule("s2")],
			"2025-03-01",
		);

		expect(result.tracked[0].id).toBe("s2");
		expect(result.tracked[1].id).toBe("s1");
	});

	it("handles supplement with no active schedules", () => {
		const result = buildStockList([row("s1", { currentStock: "10" })], [], "2025-03-01");

		expect(result.tracked[0].daysInStock).toBeGreaterThan(0);
	});
});
