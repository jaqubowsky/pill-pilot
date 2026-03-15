"use client";

import { cn } from "@/shared/lib/utils";

type Props = {
	date: string;
	dayNumber: number;
	completionPercent: number;
	totalSchedules: number;
	isToday: boolean;
	isFuture: boolean;
	onSelect: (date: string) => void;
};

function getHeatmapColor(percent: number, isFuture: boolean): string {
	if (isFuture) return "bg-surface-sunken";
	if (percent === 0) return "bg-surface-sunken";
	if (percent < 50) return "bg-brand-100";
	if (percent < 100) return "bg-brand-300";
	return "bg-brand-500";
}

function getTextColor(percent: number, isFuture: boolean): string {
	if (isFuture) return "text-content-faint";
	if (percent === 100) return "text-content-inverse";
	return "text-content";
}

export function CalendarDay({
	date,
	dayNumber,
	completionPercent,
	totalSchedules,
	isToday,
	isFuture,
	onSelect,
}: Props) {
	return (
		<button
			type="button"
			onClick={() => onSelect(date)}
			className={cn(
				"flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150",
				getHeatmapColor(totalSchedules > 0 ? completionPercent : 0, isFuture),
				getTextColor(totalSchedules > 0 ? completionPercent : 0, isFuture),
				isToday && "ring-2 ring-brand-400",
			)}
		>
			{dayNumber}
		</button>
	);
}
