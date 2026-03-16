import { describe, expect, it } from "vitest";
import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";
import {
	applyMatch,
	applyPriceChange,
	applySkip,
	applyUnskip,
	applyVerify,
	buildPriceUpdates,
	type CartItemState,
	canSaveCart,
	getUnverifiedCount,
	matchShopByName,
	toCartItemStates,
} from "./cart-logic";

function cartItem(overrides?: Partial<CartItem>): CartItem {
	return {
		productName: "Vitamin D3",
		price: 29.99,
		confidence: 0.95,
		matchedSupplementId: "supp-1",
		quantity: 1,
		...overrides,
	};
}

function cartItemState(overrides?: Partial<CartItemState>): CartItemState {
	return {
		productName: "Vitamin D3",
		price: 29.99,
		confidence: 0.95,
		matchedSupplementId: "supp-1",
		quantity: 1,
		_id: "ci_0",
		verified: true,
		skipped: false,
		...overrides,
	};
}

describe("toCartItemStates", () => {
	it("auto-verifies items with confidence >= 0.8", () => {
		const result = toCartItemStates([cartItem({ confidence: 0.9 })]);
		expect(result[0].verified).toBe(true);
		expect(result[0].skipped).toBe(false);
	});

	it("does not verify items with confidence < 0.8", () => {
		const result = toCartItemStates([cartItem({ confidence: 0.5 })]);
		expect(result[0].verified).toBe(false);
	});

	it("verifies at exact threshold 0.8", () => {
		const result = toCartItemStates([cartItem({ confidence: 0.8 })]);
		expect(result[0].verified).toBe(true);
	});

	it("does not verify at confidence 0", () => {
		const result = toCartItemStates([cartItem({ confidence: 0 })]);
		expect(result[0].verified).toBe(false);
	});

	it("verifies at confidence 1", () => {
		const result = toCartItemStates([cartItem({ confidence: 1 })]);
		expect(result[0].verified).toBe(true);
	});

	it("does not verify just below threshold", () => {
		const result = toCartItemStates([cartItem({ confidence: 0.79 })]);
		expect(result[0].verified).toBe(false);
	});

	it("assigns sequential _id values", () => {
		const result = toCartItemStates([cartItem(), cartItem(), cartItem()]);
		expect(result[0]._id).toBe("ci_0");
		expect(result[1]._id).toBe("ci_1");
		expect(result[2]._id).toBe("ci_2");
	});

	it("returns empty array for empty input", () => {
		expect(toCartItemStates([])).toEqual([]);
	});

	it("preserves original cart item fields", () => {
		const result = toCartItemStates([cartItem({ productName: "Omega-3", price: 89 })]);
		expect(result[0].productName).toBe("Omega-3");
		expect(result[0].price).toBe(89);
	});

	it("handles undefined optional fields from AI parsing", () => {
		const result = toCartItemStates([
			cartItem({ matchedSupplementId: undefined, quantity: undefined }),
		]);
		expect(result[0].matchedSupplementId).toBeUndefined();
		expect(result[0].quantity).toBeUndefined();
		expect(result[0].verified).toBe(true);
		expect(result[0].skipped).toBe(false);
	});

	it("handles null optional fields", () => {
		const result = toCartItemStates([cartItem({ matchedSupplementId: null, quantity: null })]);
		expect(result[0].matchedSupplementId).toBeNull();
		expect(result[0].quantity).toBeNull();
	});
});

describe("getUnverifiedCount", () => {
	it("returns 0 when all items are verified", () => {
		expect(getUnverifiedCount([cartItemState({ verified: true })])).toBe(0);
	});

	it("counts unverified items", () => {
		expect(
			getUnverifiedCount([
				cartItemState({ _id: "a", verified: false }),
				cartItemState({ _id: "b", verified: true }),
				cartItemState({ _id: "c", verified: false }),
			]),
		).toBe(2);
	});

	it("excludes skipped items from unverified count", () => {
		expect(getUnverifiedCount([cartItemState({ verified: false, skipped: true })])).toBe(0);
	});

	it("returns 0 for empty array", () => {
		expect(getUnverifiedCount([])).toBe(0);
	});

	it("counts correctly with mixed verified, skipped, and unverified", () => {
		expect(
			getUnverifiedCount([
				cartItemState({ _id: "a", verified: true, skipped: false }),
				cartItemState({ _id: "b", verified: false, skipped: true }),
				cartItemState({ _id: "c", verified: false, skipped: false }),
				cartItemState({ _id: "d", verified: true, skipped: true }),
			]),
		).toBe(1);
	});
});

describe("canSaveCart", () => {
	it("returns false when no items", () => {
		expect(canSaveCart([], "shop-1", "")).toBe(false);
	});

	it("returns false when unverified items exist", () => {
		expect(canSaveCart([cartItemState({ verified: false })], "shop-1", "")).toBe(false);
	});

	it("returns false when no shop selected and no shop name", () => {
		expect(canSaveCart([cartItemState({ verified: true })], null, "")).toBe(false);
	});

	it("returns false when shop name is only whitespace", () => {
		expect(canSaveCart([cartItemState({ verified: true })], null, "   ")).toBe(false);
	});

	it("returns true when all verified and shop selected", () => {
		expect(canSaveCart([cartItemState({ verified: true })], "shop-1", "")).toBe(true);
	});

	it("returns true when all verified and shop name provided", () => {
		expect(canSaveCart([cartItemState({ verified: true })], null, "iHerb")).toBe(true);
	});

	it("allows saving when items are skipped but not explicitly verified", () => {
		expect(canSaveCart([cartItemState({ verified: false, skipped: true })], "shop-1", "")).toBe(
			true,
		);
	});

	it("returns false with mix of verified and unverified items", () => {
		expect(
			canSaveCart(
				[cartItemState({ _id: "a", verified: true }), cartItemState({ _id: "b", verified: false })],
				"shop-1",
				"",
			),
		).toBe(false);
	});
});

describe("buildPriceUpdates", () => {
	it("builds updates from matched, non-skipped items", () => {
		const items = [
			cartItemState({ _id: "a", matchedSupplementId: "s1", price: 29.99 }),
			cartItemState({ _id: "b", matchedSupplementId: "s2", price: 49.99 }),
		];
		expect(buildPriceUpdates(items, "shop-1")).toEqual([
			{ supplementId: "s1", packagePrice: 29.99, shopId: "shop-1" },
			{ supplementId: "s2", packagePrice: 49.99, shopId: "shop-1" },
		]);
	});

	it("excludes skipped items", () => {
		const items = [
			cartItemState({ _id: "a", matchedSupplementId: "s1", skipped: true }),
			cartItemState({ _id: "b", matchedSupplementId: "s2", skipped: false }),
		];
		const result = buildPriceUpdates(items, null);
		expect(result).toHaveLength(1);
		expect(result[0].supplementId).toBe("s2");
	});

	it("excludes unmatched items with null matchedSupplementId", () => {
		const items = [
			cartItemState({ _id: "a", matchedSupplementId: null }),
			cartItemState({ _id: "b", matchedSupplementId: "s2" }),
		];
		const result = buildPriceUpdates(items, null);
		expect(result).toHaveLength(1);
		expect(result[0].supplementId).toBe("s2");
	});

	it("excludes items with undefined matchedSupplementId", () => {
		const items = [
			cartItemState({ _id: "a", matchedSupplementId: undefined }),
			cartItemState({ _id: "b", matchedSupplementId: "s2" }),
		];
		const result = buildPriceUpdates(items, null);
		expect(result).toHaveLength(1);
		expect(result[0].supplementId).toBe("s2");
	});

	it("omits shopId when null", () => {
		const items = [cartItemState({ matchedSupplementId: "s1" })];
		const result = buildPriceUpdates(items, null);
		expect(result[0]).toEqual({ supplementId: "s1", packagePrice: 29.99 });
		expect("shopId" in result[0]).toBe(false);
	});

	it("returns empty array when all items skipped", () => {
		expect(
			buildPriceUpdates([cartItemState({ skipped: true, matchedSupplementId: "s1" })], "shop-1"),
		).toEqual([]);
	});

	it("returns empty array for empty items", () => {
		expect(buildPriceUpdates([], "shop-1")).toEqual([]);
	});
});

describe("matchShopByName", () => {
	const shops = [
		{ id: "s1", name: "iHerb" },
		{ id: "s2", name: "Allegro" },
	];

	it("matches exact name", () => {
		expect(matchShopByName("iHerb", shops)).toBe("s1");
	});

	it("matches case-insensitively", () => {
		expect(matchShopByName("IHERB", shops)).toBe("s1");
		expect(matchShopByName("allegro", shops)).toBe("s2");
	});

	it("returns null when no match", () => {
		expect(matchShopByName("Amazon", shops)).toBeNull();
	});

	it("returns null for empty shop list", () => {
		expect(matchShopByName("iHerb", [])).toBeNull();
	});

	it("returns null for empty name", () => {
		expect(matchShopByName("", shops)).toBeNull();
	});
});

describe("applyMatch", () => {
	it("sets matchedSupplementId and verifies when matched", () => {
		const items = [cartItemState({ _id: "a", matchedSupplementId: null, verified: false })];
		const result = applyMatch(items, "a", "supp-1");
		expect(result[0].matchedSupplementId).toBe("supp-1");
		expect(result[0].verified).toBe(true);
	});

	it("unverifies when set to null", () => {
		const items = [cartItemState({ _id: "a", matchedSupplementId: "supp-1", verified: true })];
		const result = applyMatch(items, "a", null);
		expect(result[0].matchedSupplementId).toBeNull();
		expect(result[0].verified).toBe(false);
	});

	it("does not affect other items", () => {
		const items = [
			cartItemState({ _id: "a", matchedSupplementId: "s1" }),
			cartItemState({ _id: "b", matchedSupplementId: "s2" }),
		];
		const result = applyMatch(items, "a", "s3");
		expect(result[1].matchedSupplementId).toBe("s2");
		expect(result[1].verified).toBe(true);
	});

	it("returns items unchanged for non-existent id", () => {
		const items = [cartItemState({ _id: "a", matchedSupplementId: "s1" })];
		const result = applyMatch(items, "nonexistent", "s2");
		expect(result[0].matchedSupplementId).toBe("s1");
	});
});

describe("applyVerify", () => {
	it("sets verified to true", () => {
		const items = [cartItemState({ _id: "a", verified: false })];
		const result = applyVerify(items, "a");
		expect(result[0].verified).toBe(true);
	});

	it("does not affect other fields", () => {
		const items = [cartItemState({ _id: "a", verified: false, skipped: false, price: 10 })];
		const result = applyVerify(items, "a");
		expect(result[0].skipped).toBe(false);
		expect(result[0].price).toBe(10);
	});

	it("does not affect other items", () => {
		const items = [
			cartItemState({ _id: "a", verified: false }),
			cartItemState({ _id: "b", verified: false }),
		];
		const result = applyVerify(items, "a");
		expect(result[1].verified).toBe(false);
	});

	it("returns items unchanged for non-existent id", () => {
		const items = [cartItemState({ _id: "a", verified: false })];
		const result = applyVerify(items, "nonexistent");
		expect(result[0].verified).toBe(false);
	});
});

describe("applySkip", () => {
	it("sets skipped and verified to true", () => {
		const items = [cartItemState({ _id: "a", skipped: false, verified: false })];
		const result = applySkip(items, "a");
		expect(result[0].skipped).toBe(true);
		expect(result[0].verified).toBe(true);
	});

	it("returns items unchanged for non-existent id", () => {
		const items = [cartItemState({ _id: "a", skipped: false })];
		const result = applySkip(items, "nonexistent");
		expect(result[0].skipped).toBe(false);
	});
});

describe("applyUnskip", () => {
	it("sets skipped and verified to false", () => {
		const items = [cartItemState({ _id: "a", skipped: true, verified: true })];
		const result = applyUnskip(items, "a");
		expect(result[0].skipped).toBe(false);
		expect(result[0].verified).toBe(false);
	});

	it("returns items unchanged for non-existent id", () => {
		const items = [cartItemState({ _id: "a", skipped: true, verified: true })];
		const result = applyUnskip(items, "nonexistent");
		expect(result[0].skipped).toBe(true);
		expect(result[0].verified).toBe(true);
	});
});

describe("applyPriceChange", () => {
	it("updates price for the target item", () => {
		const items = [cartItemState({ _id: "a", price: 10 })];
		expect(applyPriceChange(items, "a", 25.5)[0].price).toBe(25.5);
	});

	it("does not affect other items", () => {
		const items = [cartItemState({ _id: "a", price: 10 }), cartItemState({ _id: "b", price: 20 })];
		expect(applyPriceChange(items, "a", 99)[1].price).toBe(20);
	});

	it("returns items unchanged for non-existent id", () => {
		const items = [cartItemState({ _id: "a", price: 10 })];
		expect(applyPriceChange(items, "nonexistent", 99)[0].price).toBe(10);
	});

	it("does not affect other fields", () => {
		const items = [cartItemState({ _id: "a", price: 10, verified: false })];
		const result = applyPriceChange(items, "a", 50);
		expect(result[0].verified).toBe(false);
		expect(result[0].productName).toBe("Vitamin D3");
	});
});
