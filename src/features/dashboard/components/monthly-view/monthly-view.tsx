"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MonthlyStatus } from "@/features/dashboard/api/queries/get-monthly-status";
import { ViewSwitcher } from "@/features/dashboard/components/view-switcher";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { CalendarDay } from "./calendar-day";
import { useMonthlyView } from "./use-monthly-view";

type Props = {
	status: MonthlyStatus;
	yearMonth: string;
};

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function MonthlyView({ status, yearMonth }: Props) {
	const t = useTranslations("dashboard.monthlyView");
	const {
		isCurrentMonth,
		monthLabel,
		firstDayOfWeek,
		goToPrevMonth,
		goToNextMonth,
		navigateToDay,
	} = useMonthlyView({ yearMonth });

	const todayStr = toDateString(new Date());

	const pastDays = status.days.filter((d) => d.totalSchedules > 0 && d.date <= todayStr);
	const totalDays = pastDays.length;
	const completeDays = pastDays.filter((d) => d.completionPercent === 100).length;

	const emptyKeys = Array.from({ length: firstDayOfWeek }, (_, i) => `empty-${i}`);

	return (
		<div className="flex flex-col gap-lg px-md pt-2xl pb-3xl">
			<ViewSwitcher />

			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onClick={goToPrevMonth}
					className="text-brand-600"
					aria-label={t("prevMonth")}
				>
					<ChevronLeft className="size-5" />
				</Button>
				<h1 className={cn("font-display text-xl text-content", isCurrentMonth && "text-brand-600")}>
					{monthLabel}
				</h1>
				<Button
					variant="ghost"
					size="icon"
					onClick={goToNextMonth}
					className="text-brand-600"
					aria-label={t("nextMonth")}
				>
					<ChevronRight className="size-5" />
				</Button>
			</div>

			<div className="rounded-xl border border-edge-subtle bg-surface-raised p-md shadow-sm">
				<div className="grid grid-cols-7 gap-xs mb-sm">
					{WEEKDAY_LABELS.map((label) => (
						<div
							key={label}
							className="text-center text-xs font-semibold uppercase tracking-wide text-content-faint"
						>
							{label}
						</div>
					))}
				</div>
				<div className="grid grid-cols-7 gap-xs">
					{emptyKeys.map((key) => (
						<div key={key} />
					))}

					{status.days.map((day) => (
						<CalendarDay
							key={day.date}
							date={day.date}
							dayNumber={new Date(`${day.date}T00:00:00`).getDate()}
							completionPercent={day.completionPercent}
							totalSchedules={day.totalSchedules}
							isToday={day.date === todayStr}
							isFuture={day.date > todayStr}
							onSelect={navigateToDay}
						/>
					))}
				</div>
			</div>

			<div className="text-center">
				<span className="text-2xl font-bold text-content">
					{completeDays}/{totalDays}
				</span>
				<p className="text-sm text-content-muted">{t("perfectDays")}</p>
			</div>

			<div className="flex items-center justify-center gap-md">
				<div className="flex items-center gap-xs">
					<div className="size-3 rounded-sm bg-surface-sunken" />
					<span className="text-xs text-content-muted">0%</span>
				</div>
				<div className="flex items-center gap-xs">
					<div className="size-3 rounded-sm bg-brand-100" />
					<span className="text-xs text-content-muted">&lt;50%</span>
				</div>
				<div className="flex items-center gap-xs">
					<div className="size-3 rounded-sm bg-brand-300" />
					<span className="text-xs text-content-muted">&lt;100%</span>
				</div>
				<div className="flex items-center gap-xs">
					<div className="size-3 rounded-sm bg-brand-500" />
					<span className="text-xs text-content-muted">100%</span>
				</div>
			</div>
		</div>
	);
}
