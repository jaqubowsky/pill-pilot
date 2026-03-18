"use client";

import type {
	DailyStatus,
	TimeBlockStatus,
	TimeBlockSummary,
} from "@/features/dashboard/api/queries/get-daily-status";
import { TimeBlock } from "@/features/dashboard/components/time-block";
import { ViewSwitcher } from "@/features/dashboard/components/view-switcher";
import { ActiveTimersBanner } from "./active-timers-banner";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DateNavigator } from "./date-navigator";
import { ProcessingBanner } from "./processing-banner";
import { ProgressRing } from "./progress-ring";
import { useDailyView } from "./use-daily-view";

type Props = {
	status: DailyStatus;
	activeBlockIndex: number;
	hasProcessing?: boolean;
	hasDraft?: boolean;
};

function toTimeBlockSummaries(blocks: TimeBlockStatus[]): TimeBlockSummary[] {
	return blocks.map((b) => ({
		id: b.blockId,
		name: b.blockName,
		startTime: b.startTime,
	}));
}

export function DailyView({ status, activeBlockIndex, hasProcessing, hasDraft }: Props) {
	const { parsedDate, isEmpty, goToPrevDay, goToNextDay } = useDailyView({
		status,
	});

	const timeBlockSummaries = toTimeBlockSummaries(status.timeBlocks);

	return (
		<div className="flex flex-col gap-lg px-md pt-2xl pb-3xl">
			<ViewSwitcher />

			{hasProcessing && !isEmpty && <ProcessingBanner />}

			<DateNavigator date={parsedDate} onPrev={goToPrevDay} onNext={goToNextDay} />

			{!isEmpty && (
				<div className="flex justify-center">
					<ProgressRing completed={status.completedCount} total={status.totalSchedules} />
				</div>
			)}

			{isEmpty ? (
				<DashboardEmptyState hasDraft={hasDraft} hasProcessing={hasProcessing} />
			) : (
				<div className="flex flex-col gap-sm">
					{status.timeBlocks.map((block, index) => (
						<TimeBlock
							key={block.blockId}
							block={block}
							defaultOpen={index === activeBlockIndex}
							protocolColors={status.protocolColors}
							timeBlocks={timeBlockSummaries}
						/>
					))}
				</div>
			)}

			{!isEmpty && <ActiveTimersBanner entries={status.timeBlocks.flatMap((b) => b.entries)} />}
		</div>
	);
}
