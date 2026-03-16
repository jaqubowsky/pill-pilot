"use client";

import { AlertTriangle, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ShoppingGroup } from "../../api/queries/get-shopping-list";
import { optimizeShopping } from "../../lib/optimize-shopping";

type ShoppingListProps = {
	groups: ShoppingGroup[];
};

function formatAmount(amount: number): string {
	return amount.toFixed(2).replace(".", ",");
}

function formatDepletionDate(depletionDate: string): string {
	const date = new Date(depletionDate);
	return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
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
							{order.shop?.deliveryCost !== null && order.shop?.deliveryCost !== undefined && (
								<span className="text-xs text-content-faint">
									{order.wouldReachFreeDelivery
										? t("list.freeDelivery")
										: t("list.deliveryCost", {
												cost: formatAmount(parseFloat(order.shop.deliveryCost)),
											})}
								</span>
							)}
						</div>

						<div className="border-t border-dashed border-edge px-md">
							{order.mustBuy.map((item) => (
								<div
									key={item.id}
									className="flex items-center gap-sm py-sm border-b border-dashed border-edge-subtle last:border-b-0"
								>
									{item.daysRemaining <= 3 && (
										<div className="flex items-center justify-center size-7 rounded-md shrink-0 bg-danger-bg">
											<AlertTriangle size={14} strokeWidth={1.5} className="text-danger" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="text-sm text-content truncate">{item.name}</p>
										<p className="text-xs text-content-faint">
											{t("list.depletionDate", {
												date: formatDepletionDate(item.depletionDate),
											})}
										</p>
									</div>
									<div className="flex flex-col items-end shrink-0 gap-xs">
										{item.packagePrice !== null && (
											<span className="text-sm font-semibold text-content tabular-nums">
												{formatAmount(parseFloat(item.packagePrice))} zł
											</span>
										)}
										{item.daysRemaining <= 3 && (
											<span className="text-xs font-semibold uppercase tracking-wide text-danger bg-danger-bg rounded-md px-xs py-0.5">
												{t("list.urgent")}
											</span>
										)}
									</div>
								</div>
							))}
						</div>

						{order.suggestAdd.length > 0 && (
							<div className="border-t border-dashed border-edge px-md">
								<p className="text-xs font-semibold uppercase tracking-wide text-content-faint pt-sm pb-xs">
									{t("list.suggestAdd")}
								</p>
								{order.suggestAdd.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-sm py-sm border-b border-dashed border-edge-subtle last:border-b-0 opacity-60"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-content-muted truncate">{item.name}</p>
											<p className="text-xs text-content-faint">
												{t("list.depletionDate", {
													date: formatDepletionDate(item.depletionDate),
												})}
											</p>
										</div>
										{item.packagePrice !== null && (
											<span className="text-sm text-content-muted tabular-nums shrink-0">
												{formatAmount(parseFloat(item.packagePrice))} zł
											</span>
										)}
									</div>
								))}
							</div>
						)}

						{order.amountToFreeDelivery !== null && order.suggestAdd.length > 0 && (
							<div className="px-md py-xs">
								<p className="text-xs text-warning font-medium">
									{t("list.addForFreeDelivery", {
										amount: formatAmount(order.amountToFreeDelivery),
									})}
								</p>
							</div>
						)}

						<div className="border-t-2 border-edge px-md py-sm flex flex-col gap-xs">
							<div className="flex items-center justify-between">
								<span className="text-sm text-content-muted">{t("list.subtotal")}</span>
								<span className="text-sm font-medium text-content tabular-nums">
									{formatAmount(order.subtotal)} zł
								</span>
							</div>
							{order.deliveryCost > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-content-muted">{t("list.delivery")}</span>
									<span className="text-sm text-content tabular-nums">
										{formatAmount(order.deliveryCost)} zł
									</span>
								</div>
							)}
						</div>
					</div>
				);
			})}

			{grandTotal > 0 && (
				<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex items-center justify-between">
					<span className="text-base font-bold text-content">{t("list.grandTotal")}</span>
					<span className="text-base font-bold text-content tabular-nums">
						{formatAmount(grandTotal)} zł
					</span>
				</div>
			)}
		</div>
	);
}
