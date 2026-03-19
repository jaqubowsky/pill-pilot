import { useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/format-currency";
import type { OptimizedShopOrder } from "../../../lib/optimize-shopping";

type Props = {
	order: OptimizedShopOrder;
};

export function OrderSummary({ order }: Props) {
	const t = useTranslations("shopping.list");
	const tCommon = useTranslations("common");

	if (order.mustBuy.length === 0) return null;

	return (
		<>
			{order.amountToFreeDelivery !== null &&
				order.amountToFreeDelivery > 0 &&
				order.suggestSubtotal >= order.amountToFreeDelivery && (
					<div className="px-md py-xs">
						<p className="text-xs text-warning font-medium">
							{t("addForFreeDelivery", { amount: formatAmount(order.amountToFreeDelivery) })}
						</p>
					</div>
				)}

			<div className="border-t-2 border-edge px-md py-sm flex flex-col gap-xs">
				<div className="flex items-center justify-between">
					<span className="text-sm text-content-muted">{t("subtotal")}</span>
					<span className="text-sm font-medium text-content tabular-nums">
						{formatAmount(order.subtotal)} {tCommon("currency")}
					</span>
				</div>
				{order.suggestSubtotal > 0 && (
					<div className="flex items-center justify-between opacity-60">
						<span className="text-sm text-content-muted">{t("withSuggest")}</span>
						<span className="text-sm text-content-muted tabular-nums">
							{formatAmount(order.subtotal + order.suggestSubtotal)} {tCommon("currency")}
						</span>
					</div>
				)}
				{order.deliveryCost > 0 && (
					<div className="flex items-center justify-between">
						<span className="text-sm text-content-muted">{t("delivery")}</span>
						<span className="text-sm text-content tabular-nums">
							{formatAmount(order.deliveryCost)} {tCommon("currency")}
						</span>
					</div>
				)}
			</div>
		</>
	);
}
