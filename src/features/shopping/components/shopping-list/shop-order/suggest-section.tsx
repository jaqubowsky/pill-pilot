import { useTranslations } from "next-intl";
import type { OptimizedShopOrder } from "../../../lib/optimize-shopping";
import { ItemRow } from "./item-row";

type Props = {
	items: OptimizedShopOrder["suggestAdd"];
	hasMustBuyItems: boolean;
};

export function SuggestSection({ items, hasMustBuyItems }: Props) {
	const t = useTranslations("shopping.list");

	if (items.length === 0) return null;

	return (
		<div className="border-t border-dashed border-edge px-md">
			<p className="text-xs font-semibold uppercase tracking-wide text-content-faint pt-sm pb-xs">
				{hasMustBuyItems ? t("suggestAdd") : t("endingSoon")}
			</p>
			{items.map((item) => (
				<ItemRow key={item.id} item={item} muted />
			))}
		</div>
	);
}
