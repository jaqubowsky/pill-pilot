"use client";

import { useTranslations } from "next-intl";
import type { ExpenseData } from "@/features/shopping/api/queries/get-expense-data";

type ExpenseSummaryProps = {
	data: ExpenseData;
};

function formatCurrency(value: number): string {
	return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonthLabel(monthKey: string): string {
	const [year, month] = monthKey.split("-");
	const date = new Date(Number(year), Number(month) - 1, 1);
	return date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

export function ExpenseSummary({ data }: ExpenseSummaryProps) {
	const t = useTranslations("shopping.expenses");

	const hasCurrentMonthData = data.currentMonth.weeks.length > 0;
	const hasPreviousData = data.previousMonths.some((m) => m.total > 0);
	const hasAnyData = hasCurrentMonthData || hasPreviousData;

	return (
		<div className="flex flex-col gap-md">
			<h2 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
				{t("title")}
			</h2>

			{!hasAnyData && <p className="text-sm text-content-faint">{t("noData")}</p>}

			{hasCurrentMonthData && (
				<div className="flex flex-col gap-sm">
					<p className="text-sm font-medium text-content-muted">{t("currentMonth")}</p>
					<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-xs">
						{data.currentMonth.weeks.map((week) => (
							<div key={week.weekNum} className="flex items-center justify-between">
								<span className="text-sm text-content-muted">
									{t("week", { num: week.weekNum })}
								</span>
								<span className="text-sm font-medium text-content">
									{formatCurrency(week.cost)} zł
								</span>
							</div>
						))}
						<div className="border-t border-edge-subtle mt-xs pt-xs flex items-center justify-between">
							<span className="text-sm font-semibold text-content">{t("total")}</span>
							<span className="text-sm font-semibold text-content">
								{formatCurrency(data.currentMonth.total)} zł
							</span>
						</div>
					</div>
				</div>
			)}

			{hasPreviousData && (
				<div className="flex flex-col gap-sm">
					<p className="text-sm font-medium text-content-muted">{t("previousMonths")}</p>
					<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-xs">
						{data.previousMonths
							.filter((m) => m.total > 0)
							.map((month) => (
								<div key={month.month} className="flex items-center justify-between">
									<span className="text-sm text-content-muted capitalize">
										{formatMonthLabel(month.month)}
									</span>
									<span className="text-sm font-medium text-content">
										{formatCurrency(month.total)} zł
									</span>
								</div>
							))}
					</div>
				</div>
			)}

			{data.supplementsMissingPrices > 0 && (
				<p className="text-xs text-content-faint">
					{t("missingPrices", { count: data.supplementsMissingPrices })}
				</p>
			)}
		</div>
	);
}
