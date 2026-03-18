"use client";

import { useTranslations } from "next-intl";
import { useStockProgressBar } from "./use-stock-progress-bar";

type StockProgressBarProps = {
	currentStock: number;
	daysInStock: number;
	dailyUsage: number;
	packageSize: number | null;
};

export function StockProgressBar({
	currentStock,
	daysInStock,
	dailyUsage,
	packageSize,
}: StockProgressBarProps) {
	const t = useTranslations("stock");
	const { hasUsage, percent } = useStockProgressBar({
		currentStock,
		daysInStock,
		dailyUsage,
		packageSize,
	});

	function getFillColor() {
		if (!hasUsage) return "bg-brand-500";
		if (daysInStock < 3) return "bg-danger";
		if (daysInStock < 7) return "bg-warning";
		return "bg-brand-500";
	}

	return (
		<div className="flex items-center gap-sm">
			<div className="flex-1 h-2 rounded-full bg-brand-100 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-300 ${getFillColor()}`}
					style={{ width: `${percent}%` }}
				/>
			</div>
			{hasUsage && (
				<span className="text-xs text-content-muted whitespace-nowrap">
					{currentStock > 0 && daysInStock === 0 ? "<1" : `~${daysInStock}`} {t("days")}
				</span>
			)}
		</div>
	);
}
