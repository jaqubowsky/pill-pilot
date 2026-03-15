"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LowStockItem } from "@/features/stock/api/queries/get-low-stock";
import { formatQuantity } from "@/shared/lib/format";

type BuySoonItemProps = {
	item: LowStockItem;
};

export function BuySoonItem({ item }: BuySoonItemProps) {
	const t = useTranslations();

	const unit = t(`schedule.units.${item.stockUnit}`);
	const isCritical = item.daysRemaining < 3;
	const daysLabel =
		Number(item.currentStock) > 0 && item.daysRemaining === 0 ? "<1" : `~${item.daysRemaining}`;

	return (
		<div className="flex items-center gap-md p-md bg-surface-raised border border-edge-subtle rounded-xl shadow-sm">
			<div
				className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${isCritical ? "bg-danger-bg" : "bg-warning-bg"}`}
			>
				<AlertTriangle
					size={18}
					strokeWidth={1.5}
					className={isCritical ? "text-danger" : "text-warning"}
				/>
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-content truncate">{item.name}</p>
				{item.brandName && <p className="text-xs text-content-muted truncate">{item.brandName}</p>}
				<p className="text-xs text-content-faint">
					{formatQuantity(item.currentStock)} {unit} &middot; {daysLabel} {t("stock.days")}
				</p>
			</div>
			<span
				className={`inline-flex items-center rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide shrink-0 ${isCritical ? "bg-danger-bg text-danger" : "bg-warning-bg text-[#8B6914]"}`}
			>
				{isCritical ? t("stock.buySoon.critical") : t("stock.buySoon.low")}
			</span>
		</div>
	);
}
