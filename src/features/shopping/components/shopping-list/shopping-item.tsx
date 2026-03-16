"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OptimizedItem } from "../../lib/optimize-shopping";

type ShoppingItemProps = {
	item: OptimizedItem;
};

function formatPrice(price: string | null): string | null {
	if (price === null) return null;
	const num = parseFloat(price);
	if (Number.isNaN(num)) return null;
	return num.toFixed(2).replace(".", ",");
}

function formatDepletionDate(depletionDate: string): string {
	const date = new Date(depletionDate);
	return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function ShoppingItem({ item }: ShoppingItemProps) {
	const t = useTranslations("shopping");
	const formattedPrice = formatPrice(item.packagePrice);
	const isUrgent = !item.isSuggested && item.daysRemaining <= 3;

	return (
		<div
			className={`flex items-center gap-md p-md bg-surface-raised border border-edge-subtle rounded-xl shadow-sm ${item.isSuggested ? "opacity-60" : ""}`}
		>
			{isUrgent && (
				<div className="flex items-center justify-center size-9 rounded-lg shrink-0 bg-danger-bg">
					<AlertTriangle size={18} strokeWidth={1.5} className="text-danger" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-content truncate">{item.name}</p>
				<p className="text-xs text-content-faint">
					{t("list.depletionDate", { date: formatDepletionDate(item.depletionDate) })}
				</p>
			</div>
			<div className="flex flex-col items-end shrink-0 gap-xs">
				{formattedPrice !== null && (
					<span className="text-sm font-semibold text-content">{formattedPrice} zł</span>
				)}
				{isUrgent && (
					<span className="inline-flex items-center rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-danger-bg text-danger">
						{t("list.urgent")}
					</span>
				)}
				{item.isSuggested && (
					<span className="inline-flex items-center rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-info-bg text-info">
						{t("list.suggestLabel")}
					</span>
				)}
			</div>
		</div>
	);
}
