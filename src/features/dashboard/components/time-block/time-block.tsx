"use client";

import type {
	TimeBlockStatus,
	TimeBlockSummary,
} from "@/features/dashboard/api/queries/get-daily-status";
import { CheckAllButton } from "@/features/dashboard/components/check-all-button";
import { SupplementRow } from "@/features/dashboard/components/supplement-row";
import { PROTOCOL_BORDER_COLORS } from "@/features/dashboard/lib/protocol-colors";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { TimeBlockHeader } from "./time-block-header";
import { useTimeBlock } from "./use-time-block";

type Props = {
	block: TimeBlockStatus;
	defaultOpen: boolean;
	protocolColors: Record<string, number>;
	timeBlocks: TimeBlockSummary[];
};

export function TimeBlock({ block, defaultOpen, protocolColors, timeBlocks }: Props) {
	const { isOpen, uncheckedIds, allScheduleIds, toggleOpen } = useTimeBlock({ block, defaultOpen });

	return (
		<div className="overflow-hidden rounded-xl bg-surface-raised shadow-sm">
			<Button
				variant="ghost"
				className="h-auto w-full justify-start rounded-none px-0 text-left active:scale-[0.98] transition-transform"
				onClick={toggleOpen}
			>
				<TimeBlockHeader
					icon={block.blockIcon}
					name={block.blockName}
					startTime={block.startTime}
					completed={block.completedCount}
					total={block.actionableCount}
					isOpen={isOpen}
				/>
			</Button>

			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-250 ease-out",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden min-h-0">
					<div className="flex flex-col gap-sm px-md pb-md pt-sm">
						{block.entries.map((entry) => (
							<SupplementRow
								key={entry.scheduleId}
								entry={entry}
								initialChecked={!!entry.logId}
								protocolBorderColor={PROTOCOL_BORDER_COLORS[protocolColors[entry.protocolId] ?? 0]}
								timeBlocks={timeBlocks}
							/>
						))}

						<CheckAllButton scheduleIds={allScheduleIds} uncheckedIds={uncheckedIds} />
					</div>
				</div>
			</div>
		</div>
	);
}
