import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";
import type { ShopOption } from "@/shared/types";

export const CART_CONFIDENCE_THRESHOLD = 0.8;

export type CartItemState = CartItem & {
	_id: string;
	verified: boolean;
	skipped: boolean;
};

export type { ShopOption } from "@/shared/types";

export function toCartItemStates(items: CartItem[]): CartItemState[] {
	return items.map((item, i) => ({
		...item,
		_id: `ci_${i}`,
		verified: item.confidence >= CART_CONFIDENCE_THRESHOLD,
		skipped: false,
	}));
}

export function getUnverifiedCount(items: CartItemState[]): number {
	return items.filter((i) => !i.verified && !i.skipped).length;
}

export function canSaveCart(
	items: CartItemState[],
	selectedShopId: string | null,
	shopName: string,
): boolean {
	if (items.length === 0) return false;
	if (getUnverifiedCount(items) > 0) return false;
	if (!selectedShopId && !shopName.trim()) return false;
	return true;
}

export function buildPriceUpdates(
	items: CartItemState[],
	shopId: string | null,
): { supplementId: string; packagePrice: number; shopId?: string }[] {
	return items
		.filter(
			(item): item is CartItemState & { matchedSupplementId: string } =>
				!item.skipped && !!item.matchedSupplementId,
		)
		.map((item) => ({
			supplementId: item.matchedSupplementId,
			packagePrice: item.price,
			...(shopId ? { shopId } : {}),
		}));
}

export function matchShopByName(shopName: string, shops: ShopOption[]): string | null {
	const match = shops.find((s) => s.name.toLowerCase() === shopName.toLowerCase());
	return match?.id ?? null;
}

export function applyMatch(
	items: CartItemState[],
	itemId: string,
	supplementId: string | null,
): CartItemState[] {
	return items.map((item) =>
		item._id === itemId
			? { ...item, matchedSupplementId: supplementId, verified: supplementId !== null }
			: item,
	);
}

export function applyVerify(items: CartItemState[], itemId: string): CartItemState[] {
	return items.map((item) => (item._id === itemId ? { ...item, verified: true } : item));
}

export function applySkip(items: CartItemState[], itemId: string): CartItemState[] {
	return items.map((item) =>
		item._id === itemId ? { ...item, skipped: true, verified: true } : item,
	);
}

export function applyUnskip(items: CartItemState[], itemId: string): CartItemState[] {
	return items.map((item) =>
		item._id === itemId ? { ...item, skipped: false, verified: false } : item,
	);
}

export function applyPriceChange(
	items: CartItemState[],
	itemId: string,
	price: number,
): CartItemState[] {
	return items.map((item) => (item._id === itemId ? { ...item, price } : item));
}
