import { describe, expect, it } from "vitest";
import type { ShoppingGroup, ShoppingItem } from "../api/queries/get-shopping-list";
import { optimizeShopping } from "./optimize-shopping";

function item(overrides?: Partial<ShoppingItem>): ShoppingItem {
	return {
		id: "s1",
		name: "NAC",
		packagePrice: "65.00",
		packageSize: 90,
		shopId: null,
		stockUnit: "capsule",
		stockWarningThreshold: 7,
		daysRemaining: 5,
		depletionDate: "2026-03-22",
		isMustBuy: true,
		...overrides,
	};
}

function shop(
	overrides?: Partial<NonNullable<ShoppingGroup["shop"]>>,
): NonNullable<ShoppingGroup["shop"]> {
	return {
		id: "shop1",
		name: "TestShop",
		deliveryCost: "20.00",
		freeDeliveryThreshold: "200.00",
		...overrides,
	};
}

describe("optimizeShopping", () => {
	it("returns empty when no groups", () => {
		const result = optimizeShopping([]);
		expect(result.orders).toHaveLength(0);
		expect(result.grandTotal).toBe(0);
	});

	it("returns empty when group has no items", () => {
		const result = optimizeShopping([{ shop: shop(), items: [] }]);
		expect(result.orders).toHaveLength(0);
	});

	it("separates must-buy and suggest items", () => {
		const mustItem = item({ id: "s1", isMustBuy: true });
		const suggestItem = item({ id: "s2", isMustBuy: false, daysRemaining: 20 });
		const result = optimizeShopping([{ shop: null, items: [mustItem, suggestItem] }]);

		expect(result.orders).toHaveLength(1);
		expect(result.orders[0].mustBuy).toHaveLength(1);
		expect(result.orders[0].mustBuy[0].isSuggested).toBe(false);
		expect(result.orders[0].suggestAdd).toHaveLength(1);
		expect(result.orders[0].suggestAdd[0].isSuggested).toBe(true);
	});

	it("calculates subtotal from must-buy only", () => {
		const mustItem = item({ id: "s1", packagePrice: "50.00", isMustBuy: true });
		const suggestItem = item({ id: "s2", packagePrice: "30.00", isMustBuy: false });
		const result = optimizeShopping([{ shop: null, items: [mustItem, suggestItem] }]);

		expect(result.orders[0].subtotal).toBe(50);
		expect(result.orders[0].suggestSubtotal).toBe(30);
	});

	it("grandTotal sums must-buy + delivery only", () => {
		const mustItem = item({ id: "s1", packagePrice: "50.00", isMustBuy: true });
		const suggestItem = item({ id: "s2", packagePrice: "30.00", isMustBuy: false });
		const result = optimizeShopping([
			{
				shop: shop({ deliveryCost: "15.00", freeDeliveryThreshold: "200.00" }),
				items: [mustItem, suggestItem],
			},
		]);

		expect(result.grandTotal).toBe(65);
	});

	describe("delivery cost", () => {
		it("charges delivery when below free threshold", () => {
			const result = optimizeShopping([
				{
					shop: shop({ deliveryCost: "20.00", freeDeliveryThreshold: "200.00" }),
					items: [item({ packagePrice: "50.00" })],
				},
			]);

			expect(result.orders[0].deliveryCost).toBe(20);
			expect(result.orders[0].wouldReachFreeDelivery).toBe(false);
		});

		it("free delivery when must-buy + suggest reach threshold", () => {
			const result = optimizeShopping([
				{
					shop: shop({ deliveryCost: "20.00", freeDeliveryThreshold: "100.00" }),
					items: [
						item({ id: "s1", packagePrice: "70.00", isMustBuy: true }),
						item({ id: "s2", packagePrice: "40.00", isMustBuy: false }),
					],
				},
			]);

			expect(result.orders[0].wouldReachFreeDelivery).toBe(true);
			expect(result.orders[0].deliveryCost).toBe(0);
		});

		it("no delivery cost when shop has no threshold", () => {
			const result = optimizeShopping([
				{
					shop: shop({ deliveryCost: "20.00", freeDeliveryThreshold: null }),
					items: [item()],
				},
			]);

			expect(result.orders[0].deliveryCost).toBe(0);
		});

		it("no delivery cost when only suggestions (no must-buy)", () => {
			const result = optimizeShopping([
				{
					shop: shop({ deliveryCost: "20.00", freeDeliveryThreshold: "200.00" }),
					items: [item({ isMustBuy: false, daysRemaining: 20 })],
				},
			]);

			expect(result.orders[0].deliveryCost).toBe(0);
			expect(result.grandTotal).toBe(0);
		});
	});

	describe("amountToFreeDelivery", () => {
		it("calculates deficit from full subtotal", () => {
			const result = optimizeShopping([
				{
					shop: shop({ freeDeliveryThreshold: "200.00" }),
					items: [
						item({ id: "s1", packagePrice: "50.00", isMustBuy: true }),
						item({ id: "s2", packagePrice: "30.00", isMustBuy: false }),
					],
				},
			]);

			expect(result.orders[0].amountToFreeDelivery).toBe(120);
		});

		it("null when no threshold", () => {
			const result = optimizeShopping([
				{
					shop: shop({ freeDeliveryThreshold: null }),
					items: [item()],
				},
			]);

			expect(result.orders[0].amountToFreeDelivery).toBeNull();
		});

		it("null when threshold reached", () => {
			const result = optimizeShopping([
				{
					shop: shop({ freeDeliveryThreshold: "50.00" }),
					items: [item({ packagePrice: "60.00" })],
				},
			]);

			expect(result.orders[0].amountToFreeDelivery).toBeNull();
		});

		it("null when only suggestions (no must-buy)", () => {
			const result = optimizeShopping([
				{
					shop: shop({ freeDeliveryThreshold: "200.00" }),
					items: [item({ packagePrice: "50.00", isMustBuy: false })],
				},
			]);

			expect(result.orders[0].amountToFreeDelivery).toBeNull();
		});
	});

	describe("suggest-only groups", () => {
		it("includes group with only suggestions", () => {
			const result = optimizeShopping([{ shop: null, items: [item({ isMustBuy: false })] }]);

			expect(result.orders).toHaveLength(1);
			expect(result.orders[0].mustBuy).toHaveLength(0);
			expect(result.orders[0].suggestAdd).toHaveLength(1);
		});

		it("does not add to grandTotal", () => {
			const result = optimizeShopping([
				{
					shop: shop({ deliveryCost: "20.00" }),
					items: [item({ packagePrice: "59.00", isMustBuy: false })],
				},
			]);

			expect(result.grandTotal).toBe(0);
		});

		it("no delivery info for suggest-only group", () => {
			const result = optimizeShopping([
				{
					shop: shop({ deliveryCost: "20.00", freeDeliveryThreshold: "200.00" }),
					items: [item({ isMustBuy: false })],
				},
			]);

			expect(result.orders[0].deliveryCost).toBe(0);
			expect(result.orders[0].wouldReachFreeDelivery).toBe(false);
			expect(result.orders[0].amountToFreeDelivery).toBeNull();
		});
	});

	describe("multiple groups", () => {
		it("sums grandTotal across groups with must-buy only", () => {
			const result = optimizeShopping([
				{
					shop: shop({ id: "a", freeDeliveryThreshold: null }),
					items: [item({ id: "s1", packagePrice: "50.00" })],
				},
				{
					shop: shop({ id: "b", freeDeliveryThreshold: null }),
					items: [item({ id: "s2", packagePrice: "30.00", isMustBuy: false })],
				},
			]);

			expect(result.grandTotal).toBe(50);
		});
	});

	describe("null prices", () => {
		it("treats null packagePrice as 0", () => {
			const result = optimizeShopping([{ shop: null, items: [item({ packagePrice: null })] }]);

			expect(result.orders[0].subtotal).toBe(0);
		});
	});
});
