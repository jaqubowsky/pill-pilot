import type { OptimizedShopOrder } from "../../../lib/optimize-shopping";
import { ItemRow } from "./item-row";

type Props = {
	items: OptimizedShopOrder["mustBuy"];
};

export function OrderItemsSection({ items }: Props) {
	if (items.length === 0) return null;

	return (
		<div className="border-t border-dashed border-edge px-md">
			{items.map((item) => (
				<ItemRow key={item.id} item={item} muted={false} />
			))}
		</div>
	);
}
