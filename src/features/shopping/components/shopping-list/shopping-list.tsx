"use client";

import { AlertTriangle, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ShoppingGroup } from "../../api/queries/get-shopping-list";
import type { OptimizedItem, OptimizedShopOrder } from "../../lib/optimize-shopping";
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

function ItemRow({ item, muted }: { item: OptimizedItem; muted: boolean }) {
	const t = useTranslations("shopping");
	const isUrgent = item.daysRemaining <= 3;

	return (
		<div
			className={`flex items-center gap-sm py-sm border-b border-dashed border-edge-subtle last:border-b-0 ${muted ? "opacity-60" : ""}`}
		>
			{isUrgent && !muted && (
				<div className="flex items-center justify-center size-7 rounded-md shrink-0 bg-danger-bg">
					<AlertTriangle size={14} strokeWidth={1.5} className="text-danger" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<p className={`text-sm truncate ${muted ? "text-content-muted" : "text-content"}`}>
					{item.name}
				</p>
				<p className="text-xs text-content-faint">
					{t("list.depletionDate", { date: formatDepletionDate(item.depletionDate) })}
				</p>
			</div>
			<div className="flex flex-col items-end shrink-0 gap-xs">
				{item.packagePrice !== null && (
					<span
						className={`text-sm tabular-nums ${muted ? "text-content-muted" : "font-semibold text-content"}`}
					>
						{formatAmount(parseFloat(item.packagePrice))} zł
					</span>
				)}
				{isUrgent && !muted && (
					<span className="text-xs font-semibold uppercase tracking-wide text-danger bg-danger-bg rounded-md px-xs py-0.5">
						{t("list.urgent")}
					</span>
				)}
			</div>
		</div>
	);
}

function ShopOrder({
	order,
	t,
}: {
	order: OptimizedShopOrder;
	t: ReturnType<typeof useTranslations>;
}) {
	const hasMustBuyItems = order.mustBuy.length > 0;
	const hasShop = order.shop !== null;

	if (!hasShop) {
		if (order.mustBuy.length === 0) return null;
		return (
			<div className="border-t border-dashed border-edge px-md">
				{order.mustBuy.map((item) => (
					<ItemRow key={item.id} item={item} muted={false} />
				))}
			</div>
		);
	}

	return (
		<>
			{hasMustBuyItems && (
				<div className="border-t border-dashed border-edge px-md">
					{order.mustBuy.map((item) => (
						<ItemRow key={item.id} item={item} muted={false} />
					))}
				</div>
			)}

			{order.suggestAdd.length > 0 && (
				<div className="border-t border-dashed border-edge px-md">
					<p className="text-xs font-semibold uppercase tracking-wide text-content-faint pt-sm pb-xs">
						{hasMustBuyItems ? t("list.suggestAdd") : t("list.endingSoon")}
					</p>
					{order.suggestAdd.map((item) => (
						<ItemRow key={item.id} item={item} muted />
					))}
				</div>
			)}

			{hasMustBuyItems && order.amountToFreeDelivery !== null && order.suggestAdd.length > 0 && (
				<div className="px-md py-xs">
					<p className="text-xs text-warning font-medium">
						{t("list.addForFreeDelivery", {
							amount: formatAmount(order.amountToFreeDelivery),
						})}
					</p>
				</div>
			)}

			{hasMustBuyItems && (
				<div className="border-t-2 border-edge px-md py-sm flex flex-col gap-xs">
					<div className="flex items-center justify-between">
						<span className="text-sm text-content-muted">{t("list.subtotal")}</span>
						<span className="text-sm font-medium text-content tabular-nums">
							{formatAmount(order.subtotal)} zł
						</span>
					</div>
					{order.suggestSubtotal > 0 && (
						<div className="flex items-center justify-between opacity-60">
							<span className="text-sm text-content-muted">{t("list.suggestSubtotal")}</span>
							<span className="text-sm text-content-muted tabular-nums">
								+{formatAmount(order.suggestSubtotal)} zł
							</span>
						</div>
					)}
					{order.deliveryCost > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-content-muted">{t("list.delivery")}</span>
							<span className="text-sm text-content tabular-nums">
								{formatAmount(order.deliveryCost)} zł
							</span>
						</div>
					)}
				</div>
			)}
		</>
	);
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

	const hasMustBuy = orders.some((o) => o.mustBuy.length > 0);
	const totalSuggest = orders.reduce((sum, o) => sum + o.suggestSubtotal, 0);

	return (
		<div className="flex flex-col gap-lg">
			{orders
				.filter((o) => o.mustBuy.length > 0 || o.suggestAdd.length > 0)
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

							<ShopOrder order={order} t={t} />
						</div>
					);
				})}

			{hasMustBuy && grandTotal > 0 && (
				<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-xs">
					<div className="flex items-center justify-between">
						<span className="text-base font-bold text-content">{t("list.grandTotal")}</span>
						<span className="text-base font-bold text-content tabular-nums">
							{formatAmount(grandTotal)} zł
						</span>
					</div>
					{totalSuggest > 0 && (
						<div className="flex items-center justify-between opacity-60">
							<span className="text-sm text-content-muted">{t("list.suggestSubtotal")}</span>
							<span className="text-sm text-content-muted tabular-nums">
								+{formatAmount(totalSuggest)} zł
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
