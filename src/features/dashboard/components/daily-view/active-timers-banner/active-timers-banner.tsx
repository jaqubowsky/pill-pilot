"use client";

import { ChevronDown, ChevronUp, Timer } from "lucide-react";
import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";
import { formatRemainingTime } from "@/features/dashboard/lib/format-remaining-time";
import { TimerRow } from "./timer-row";
import { useActiveTimersBanner } from "./use-active-timers-banner";

type Props = {
	entries: ScheduleEntry[];
};

export function ActiveTimersBanner({ entries }: Props) {
	const { timers, nearest, expanded, toggleExpanded } = useActiveTimersBanner({
		allEntries: entries,
	});

	if (!nearest) return null;

	return (
		<div className="fixed bottom-16 left-0 right-0 z-40 px-md pb-sm">
			<div className="rounded-2xl bg-surface-raised border border-edge shadow-lg">
				<button
					type="button"
					onClick={toggleExpanded}
					className="flex w-full items-center gap-sm px-md py-sm min-h-11"
				>
					<Timer className="size-4 text-brand-500 shrink-0" />
					<span className="flex-1 text-left text-sm font-medium text-content truncate">
						{nearest.supplementName}
						{timers.length > 1 && <span className="text-content-faint"> +{timers.length - 1}</span>}
						: {formatRemainingTime(nearest.remainingMs)}
					</span>
					{expanded ? (
						<ChevronDown className="size-4 text-content-faint shrink-0" />
					) : (
						<ChevronUp className="size-4 text-content-faint shrink-0" />
					)}
				</button>

				{expanded && (
					<div className="flex flex-col gap-xs px-md pb-md border-t border-edge pt-sm">
						{timers.map((timer) => (
							<TimerRow key={`${timer.scheduleId}-${timer.type}`} timer={timer} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
