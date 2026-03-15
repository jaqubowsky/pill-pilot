"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WeeklyStatus } from "@/features/dashboard/api/queries/get-weekly-status";
import { ViewSwitcher } from "@/features/dashboard/components/view-switcher";
import { Button } from "@/shared/components/ui/button";
import { toDateString } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { useWeeklyView } from "./use-weekly-view";
import { WeekDayCell } from "./week-day-cell";

type Props = {
	status: WeeklyStatus;
	startDate: string;
};

export function WeeklyView({ status, startDate }: Props) {
	const t = useTranslations("dashboard.weeklyView");
	const { parsedStart, isCurrentWeek, goToPrevWeek, goToNextWeek, navigateToDay } = useWeeklyView({
		startDate,
	});

	const endOfWeek = new Date(parsedStart);
	endOfWeek.setDate(endOfWeek.getDate() + 6);

	const formatRange = () => {
		const startDay = parsedStart.getDate();
		const endDay = endOfWeek.getDate();
		const startMonth = parsedStart.toLocaleDateString("pl-PL", { month: "short" });
		const endMonth = endOfWeek.toLocaleDateString("pl-PL", { month: "short" });

		if (parsedStart.getMonth() === endOfWeek.getMonth()) {
			return `${startDay}–${endDay} ${startMonth} ${parsedStart.getFullYear()}`;
		}
		return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endOfWeek.getFullYear()}`;
	};

	const todayStr = toDateString(new Date());

	const weekTotal = status.days.reduce((sum, d) => sum + d.totalSchedules, 0);
	const weekCompleted = status.days.reduce((sum, d) => sum + d.completedCount, 0);
	const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

	return (
		<div className="flex flex-col gap-lg px-md pt-2xl pb-3xl">
			<ViewSwitcher />

			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onClick={goToPrevWeek}
					className="text-brand-600"
					aria-label={t("prevWeek")}
				>
					<ChevronLeft className="size-5" />
				</Button>
				<h1 className={cn("font-display text-xl text-content", isCurrentWeek && "text-brand-600")}>
					{formatRange()}
				</h1>
				<Button
					variant="ghost"
					size="icon"
					onClick={goToNextWeek}
					className="text-brand-600"
					aria-label={t("nextWeek")}
				>
					<ChevronRight className="size-5" />
				</Button>
			</div>

			{weekTotal > 0 && (
				<div className="text-center">
					<span className="text-2xl font-bold text-content">{weekPercent}%</span>
					<p className="text-sm text-content-muted">
						{t("weekSummary", { completed: weekCompleted, total: weekTotal })}
					</p>
				</div>
			)}

			<div className="flex flex-col gap-sm">
				{status.days.map((day) => (
					<WeekDayCell
						key={day.date}
						date={day.date}
						totalSchedules={day.totalSchedules}
						completedCount={day.completedCount}
						timeBlocks={day.timeBlocks}
						isToday={day.date === todayStr}
						onSelect={navigateToDay}
					/>
				))}
			</div>
		</div>
	);
}
