"use client";

import type { OptimizedShopOrder } from "../../../lib/optimize-shopping";
import { OrderItemsSection } from "./order-items-section";
import { OrderSummary } from "./order-summary";
import { SuggestSection } from "./suggest-section";

type Props = {
	order: OptimizedShopOrder;
};

export function ShopOrder({ order }: Props) {
	const hasMustBuyItems = order.mustBuy.length > 0;

	if (!order.shop && !hasMustBuyItems) return null;

	return (
		<>
			<OrderItemsSection items={order.mustBuy} />
			<SuggestSection items={order.suggestAdd} hasMustBuyItems={hasMustBuyItems} />
			<OrderSummary order={order} />
		</>
	);
}
