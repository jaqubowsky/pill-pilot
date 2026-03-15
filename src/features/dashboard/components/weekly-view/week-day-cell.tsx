"use client";

import type { WeeklyDayTimeBlock } from "@/features/dashboard/api/queries/get-weekly-status";
import { cn } from "@/shared/lib/utils";

type Props = {
	date: string;
	totalSchedules: number;
	completedCount: number;
	timeBlocks: WeeklyDayTimeBlock[];
	isToday: boolean;
	onSelect: (date: string) => void;
};

export function WeekDayCell({
	date,
	totalSchedules,
	completedCount,
	timeBlocks,
	isToday,
	onSelect,
}: Props) {
	const parsed = new Date(`${date}T00:00:00`);
	const dayName = parsed.toLocaleDateString("pl-PL", { weekday: "short" });
	const dayNumber = parsed.getDate();
	const percent = totalSchedules > 0 ? Math.round((completedCount / totalSchedules) * 100) : 0;

	return (
		<button
			type="button"
			onClick={() => onSelect(date)}
			className={cn(
				"flex items-center gap-md rounded-xl border p-md transition-colors duration-150 w-full",
				isToday ? "border-brand-400 bg-brand-50" : "border-edge-subtle bg-surface-raised",
			)}
		>
			<div className="flex flex-col items-center w-12 shrink-0">
				<span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
					{dayName}
				</span>
				<span className={cn("text-lg font-bold", isToday ? "text-brand-600" : "text-content")}>
					{dayNumber}
				</span>
			</div>

			<div className="flex flex-1 flex-col gap-xs">
				<div className="h-2 rounded-full bg-brand-100 overflow-hidden">
					<div
						className={cn(
							"h-full rounded-full transition-all duration-300",
							percent === 100
								? "bg-brand-500"
								: percent > 0
									? "bg-brand-300"
									: "bg-transparent",
						)}
						style={{ width: `${percent}%` }}
					/>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex gap-xs">
						{timeBlocks.map((block) => (
							<div
								key={block.blockId}
								className={cn(
									"size-2.5 rounded-full",
									block.completedCount === block.totalSchedules && block.totalSchedules > 0
										? "bg-brand-500"
										: block.completedCount > 0
											? "bg-brand-300"
											: "bg-surface-sunken",
								)}
							/>
						))}
					</div>
					<span className="text-xs font-medium text-content-muted">
						{totalSchedules > 0 ? `${completedCount}/${totalSchedules}` : "—"}
					</span>
				</div>
			</div>
		</button>
	);
}
