"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ShoppingGroup } from "../../api/queries/get-shopping-list";
import { optimizeShopping } from "../../lib/optimize-shopping";
import { ShoppingItem } from "./shopping-item";

type ShoppingListProps = {
	groups: ShoppingGroup[];
};

function formatAmount(amount: number): string {
	return amount.toFixed(2).replace(".", ",");
}

export function ShoppingList({ groups }: ShoppingListProps) {
	const t = useTranslations("shopping");
	const { orders, grandTotal } = optimizeShopping(groups);

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-sm pt-xl text-center px-md">
				<p className="text-base font-medium text-content-muted">{t("emptyTitle")}</p>
				<p className="text-sm text-content-faint">{t("emptyDescription")}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-lg">
			{orders.map((order) => {
				const shopName = order.shop?.name ?? t("noShop");
				const hasMustBuy = order.mustBuy.length > 0;

				return (
					<section key={order.shop?.id ?? "no-shop"} className="flex flex-col gap-sm">
						<div className="flex items-center gap-xs">
							<Store size={16} strokeWidth={1.5} className="text-content-muted" />
							<h2 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
								{shopName}
							</h2>
							{order.shop?.deliveryCost !== null && order.shop?.deliveryCost !== undefined && (
								<span className="text-xs text-content-faint ml-auto">
									{order.wouldReachFreeDelivery
										? t("list.freeDelivery")
										: t("list.deliveryCost", {
												cost: formatAmount(parseFloat(order.shop.deliveryCost)),
											})}
								</span>
							)}
						</div>

						{hasMustBuy && (
							<div className="flex flex-col gap-sm">
								{order.mustBuy.map((item) => (
									<ShoppingItem key={item.id} item={item} />
								))}
							</div>
						)}

						{order.suggestAdd.length > 0 && (
							<div className="flex flex-col gap-sm">
								<p className="text-xs font-semibold uppercase tracking-wide text-content-faint">
									{t("list.suggestAdd")}
								</p>
								{order.suggestAdd.map((item) => (
									<ShoppingItem key={item.id} item={item} />
								))}
							</div>
						)}

						{order.amountToFreeDelivery !== null && (
							<p className="text-xs text-warning font-medium px-sm">
								{t("list.addForFreeDelivery", {
									amount: formatAmount(order.amountToFreeDelivery),
								})}
							</p>
						)}

						<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-xs">
							<div className="flex items-center justify-between">
								<span className="text-sm text-content-muted">{t("list.subtotal")}</span>
								<span className="text-sm font-medium text-content">
									{formatAmount(order.subtotal)} zł
								</span>
							</div>
							{order.deliveryCost > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-content-muted">{t("list.delivery")}</span>
									<span className="text-sm text-content">
										{formatAmount(order.deliveryCost)} zł
									</span>
								</div>
							)}
						</div>
					</section>
				);
			})}

			{grandTotal > 0 && (
				<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex items-center justify-between">
					<span className="text-base font-semibold text-content">{t("list.grandTotal")}</span>
					<span className="text-base font-semibold text-content">
						{formatAmount(grandTotal)} zł
					</span>
				</div>
			)}
		</div>
	);
}
