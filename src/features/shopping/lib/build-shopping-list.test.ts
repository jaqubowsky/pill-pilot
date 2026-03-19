import { describe, expect, it } from "vitest";
import type { ShopInfo } from "./build-shopping-list";
import { buildShoppingList } from "./build-shopping-list";

const supplement = (id: string, overrides = {}) => ({
	id,
	name: `Supplement ${id}`,
	currentStock: "30",
	stockUnit: "capsule",
	stockWarningThreshold: 7,
	packagePrice: "49.99",
	packageSize: 60,
	shopId: null as string | null,
	...overrides,
});

const schedule = (supplementId: string, dosageAmount = 1) => ({
	supplementId,
	dosageAmount,
	cycleDaysOn: null,
	cycleDaysOff: null,
	startDayOffset: 0,
	durationDays: null as number | null,
	protocolStartDate: "2025-01-01",
	finishPackage: false,
});

const shopMap = new Map<string, ShopInfo>([
	["shop1", { id: "shop1", name: "Apteka A", deliveryCost: "9.99", freeDeliveryThreshold: "100" }],
	["shop2", { id: "shop2", name: "Sklep B", deliveryCost: null, freeDeliveryThreshold: null }],
]);

describe("buildShoppingList", () => {
	it("returns empty for no supplements", () => {
		expect(buildShoppingList([], [], shopMap, "2025-03-01")).toEqual([]);
	});

	it("excludes one-time supplements (all schedules have durationDays)", () => {
		const result = buildShoppingList(
			[supplement("s1", { currentStock: "5" })],
			[schedule("s1", 1)].map((s) => ({ ...s, durationDays: 14 })),
			shopMap,
			"2025-03-01",
		);
		expect(result).toEqual([]);
	});

	it("excludes finish-package-only supplements", () => {
		const result = buildShoppingList(
			[supplement("s1", { currentStock: "5" })],
			[{ ...schedule("s1"), finishPackage: true }],
			shopMap,
			"2025-03-01",
		);
		expect(result).toEqual([]);
	});

	it("includes supplements with low stock", () => {
		const result = buildShoppingList(
			[supplement("s1", { currentStock: "5" })],
			[schedule("s1", 1)],
			shopMap,
			"2025-03-01",
		);
		expect(result.length).toBeGreaterThan(0);
		expect(result.flatMap((g) => g.items).some((i) => i.id === "s1")).toBe(true);
	});

	it("marks items as mustBuy when below threshold + buffer", () => {
		const result = buildShoppingList(
			[supplement("s1", { currentStock: "3", stockWarningThreshold: 7 })],
			[schedule("s1", 1)],
			shopMap,
			"2025-03-01",
		);
		const item = result.flatMap((g) => g.items).find((i) => i.id === "s1");
		expect(item?.isMustBuy).toBe(true);
	});

	it("groups items by shop", () => {
		const result = buildShoppingList(
			[
				supplement("s1", { currentStock: "5", shopId: "shop1" }),
				supplement("s2", { currentStock: "5", shopId: "shop2" }),
			],
			[schedule("s1", 1), schedule("s2", 1)],
			shopMap,
			"2025-03-01",
		);
		expect(result.length).toBe(2);
		expect(result.find((g) => g.shop?.id === "shop1")?.items).toHaveLength(1);
		expect(result.find((g) => g.shop?.id === "shop2")?.items).toHaveLength(1);
	});

	it("puts items without shop in null group at end", () => {
		const result = buildShoppingList(
			[
				supplement("s1", { currentStock: "5", shopId: "shop1" }),
				supplement("s2", { currentStock: "5", shopId: null }),
			],
			[schedule("s1", 1), schedule("s2", 1)],
			shopMap,
			"2025-03-01",
		);
		const lastGroup = result[result.length - 1];
		expect(lastGroup.shop).toBeNull();
	});

	it("sorts items by daysRemaining ascending", () => {
		const result = buildShoppingList(
			[supplement("s1", { currentStock: "20" }), supplement("s2", { currentStock: "3" })],
			[schedule("s1", 1), schedule("s2", 1)],
			shopMap,
			"2025-03-01",
		);
		const items = result.flatMap((g) => g.items);
		expect(items[0].id).toBe("s2");
		expect(items[1].id).toBe("s1");
	});

	it("excludes supplements with infinite stock forecast", () => {
		const result = buildShoppingList(
			[supplement("s1", { currentStock: "100" })],
			[],
			shopMap,
			"2025-03-01",
		);
		expect(result).toEqual([]);
	});
});
