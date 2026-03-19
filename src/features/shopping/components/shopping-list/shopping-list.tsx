"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/format-currency";
import type { ShoppingGroup } from "../../api/queries/get-shopping-list";
import { optimizeShopping } from "../../lib/optimize-shopping";
import { ShopOrder } from "./shop-order";

type ShoppingListProps = {
	groups: ShoppingGroup[];
};

export function ShoppingList({ groups }: ShoppingListProps) {
	const t = useTranslations("shopping");
	const tCommon = useTranslations("common");
	const { orders, grandTotal } = optimizeShopping(groups);

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-sm pt-xl text-center px-md">
				<p className="text-base font-medium text-content-muted">{t("emptyTitle")}</p>
				<p className="text-sm text-content-faint">{t("emptyDescription")}</p>
			</div>
		);
	}

	const hasMustBuy = orders.some((o) => o.mustBuy.length > 0);
	const totalSuggest = orders
		.filter((o) => o.mustBuy.length > 0 && o.shop !== null)
		.reduce((sum, o) => sum + o.suggestSubtotal, 0);

	return (
		<div className="flex flex-col gap-lg">
			{orders
				.filter((o) => o.mustBuy.length > 0 || (o.suggestAdd.length > 0 && o.shop !== null))
				.map((order) => {
					const shopName = order.shop?.name ?? t("noShop");
					const hasMustBuyItems = order.mustBuy.length > 0;

					return (
						<div
							key={order.shop?.id ?? "no-shop"}
							className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm overflow-hidden"
						>
							<div className="flex items-center justify-between px-md pt-md pb-sm">
								<div className="flex items-center gap-xs">
									<Store size={14} strokeWidth={1.5} className="text-content-muted" />
									<span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
										{shopName}
									</span>
								</div>
								{hasMustBuyItems &&
									order.shop?.deliveryCost !== null &&
									order.shop?.deliveryCost !== undefined && (
										<span className="text-xs text-content-faint">
											{order.wouldReachFreeDelivery
												? t("list.freeDelivery")
												: t("list.deliveryCost", {
														cost: formatAmount(parseFloat(order.shop.deliveryCost)),
													})}
										</span>
									)}
							</div>

							<ShopOrder order={order} />
						</div>
					);
				})}

			{hasMustBuy && grandTotal > 0 && (
				<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-xs">
					<div className="flex items-center justify-between">
						<span className="text-base font-bold text-content">{t("list.grandTotal")}</span>
						<span className="text-base font-bold text-content tabular-nums">
							{formatAmount(grandTotal)} {tCommon("currency")}
						</span>
					</div>
					{totalSuggest > 0 && (
						<div className="flex items-center justify-between opacity-60">
							<span className="text-sm text-content-muted">{t("list.withSuggest")}</span>
							<span className="text-sm text-content-muted tabular-nums">
								{formatAmount(grandTotal + totalSuggest)} {tCommon("currency")}
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
