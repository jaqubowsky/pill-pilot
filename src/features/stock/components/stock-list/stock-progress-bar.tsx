"use client";

import { useTranslations } from "next-intl";

type StockProgressBarProps = {
	currentStock: number;
	dailyUsage: number;
	packageSize: number | null;
};

export function StockProgressBar({ currentStock, dailyUsage, packageSize }: StockProgressBarProps) {
	const t = useTranslations("stock");

	const hasUsage = dailyUsage > 0;
	const exactDays = hasUsage ? currentStock / dailyUsage : 0;
	const daysRemaining = Math.floor(exactDays);
	const maxStock = packageSize ?? (hasUsage ? dailyUsage * 30 : currentStock);
	const percent = maxStock > 0 ? Math.min(100, Math.round((currentStock / maxStock) * 100)) : 0;

	const fillColor = !hasUsage
		? "bg-brand-500"
		: exactDays < 3
			? "bg-danger"
			: exactDays < 7
				? "bg-warning"
				: "bg-brand-500";

	const daysLabel = currentStock > 0 && daysRemaining === 0 ? "<1" : `~${daysRemaining}`;

	return (
		<div className="flex items-center gap-sm">
			<div className="flex-1 h-2 rounded-full bg-brand-100 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
					style={{ width: `${percent}%` }}
				/>
			</div>
			{hasUsage && (
				<span className="text-xs text-content-muted whitespace-nowrap">
					{daysLabel} {t("days")}
				</span>
			)}
		</div>
	);
}
