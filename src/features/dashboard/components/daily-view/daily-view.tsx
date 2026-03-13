"use client";

import type { DailyStatus } from "@/features/dashboard/api/queries/get-daily-status";
import { TimeBlock } from "@/features/dashboard/components/time-block";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DateNavigator } from "./date-navigator";
import { ProgressRing } from "./progress-ring";
import { useDailyView } from "./use-daily-view";

type Props = {
	status: DailyStatus;
	date: string;
};

export function DailyView({ status, date }: Props) {
	const { parsedDate, isEmpty, goToPrevDay, goToNextDay, isBlockDefaultOpen, refresh } =
		useDailyView({ date, status });

	return (
		<div className="flex flex-col gap-lg px-md pt-2xl pb-3xl">
			<DateNavigator date={parsedDate} onPrev={goToPrevDay} onNext={goToNextDay} />

			{!isEmpty && (
				<div className="flex justify-center">
					<ProgressRing completed={status.completedCount} total={status.totalSchedules} />
				</div>
			)}

			{isEmpty ? (
				<DashboardEmptyState />
			) : (
				<div className="flex flex-col gap-sm">
					{status.timeBlocks.map((block, index) => (
						<TimeBlock
							key={block.blockId}
							block={block}
							date={date}
							defaultOpen={isBlockDefaultOpen(index)}
							protocolColors={status.protocolColors}
							onCheckChange={refresh}
						/>
					))}
				</div>
			)}
		</div>
	);
}
