import type { ShopInfo, ShoppingGroup, ShoppingItem } from "../api/queries/get-shopping-list";

export type OptimizedItem = ShoppingItem & {
	isSuggested: boolean;
};

export type OptimizedShopOrder = {
	shop: ShopInfo | null;
	mustBuy: OptimizedItem[];
	suggestAdd: OptimizedItem[];
	subtotal: number;
	deliveryCost: number;
	wouldReachFreeDelivery: boolean;
	amountToFreeDelivery: number | null;
};

export type OptimizedShoppingList = {
	orders: OptimizedShopOrder[];
	grandTotal: number;
};

function itemPrice(item: ShoppingItem): number {
	if (item.packagePrice === null) return 0;
	return parseFloat(item.packagePrice);
}

export function optimizeShopping(groups: ShoppingGroup[]): OptimizedShoppingList {
	const orders: OptimizedShopOrder[] = [];
	let grandTotal = 0;

	for (const group of groups) {
		const mustBuy = group.items
			.filter((i) => i.isMustBuy)
			.map<OptimizedItem>((i) => ({ ...i, isSuggested: false }));

		const suggestAdd = group.items
			.filter((i) => !i.isMustBuy)
			.map<OptimizedItem>((i) => ({ ...i, isSuggested: true }));

		const mustBuySubtotal = mustBuy.reduce((sum, i) => sum + itemPrice(i), 0);
		const suggestSubtotal = suggestAdd.reduce((sum, i) => sum + itemPrice(i), 0);
		const fullSubtotal = mustBuySubtotal + suggestSubtotal;

		const freeThreshold =
			group.shop?.freeDeliveryThreshold !== null && group.shop?.freeDeliveryThreshold !== undefined
				? parseFloat(group.shop.freeDeliveryThreshold)
				: null;

		const deliveryCostValue =
			group.shop?.deliveryCost !== null && group.shop?.deliveryCost !== undefined
				? parseFloat(group.shop.deliveryCost)
				: 0;

		const wouldReachFreeDelivery = freeThreshold !== null && fullSubtotal >= freeThreshold;

		const effectiveDeliveryCost =
			wouldReachFreeDelivery || freeThreshold === null ? 0 : deliveryCostValue;

		const amountToFreeDelivery =
			freeThreshold !== null && !wouldReachFreeDelivery
				? Math.max(0, freeThreshold - fullSubtotal)
				: null;

		if (mustBuy.length === 0 && suggestAdd.length === 0) continue;

		grandTotal += mustBuySubtotal + effectiveDeliveryCost;

		orders.push({
			shop: group.shop,
			mustBuy,
			suggestAdd,
			subtotal: mustBuySubtotal,
			deliveryCost: effectiveDeliveryCost,
			wouldReachFreeDelivery,
			amountToFreeDelivery,
		});
	}

	return { orders, grandTotal };
}
