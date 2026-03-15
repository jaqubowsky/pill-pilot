"use client";

import { Clock } from "lucide-react";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { Button } from "@/shared/components/ui/button";
import { ICON_MAP } from "@/shared/lib/time-block-icons";
import { TimeBlockEditSheet } from "../time-block-edit-sheet";
import { useTimeBlockRow } from "./use-time-block-row";

type TimeBlockRowProps = {
	timeBlock: UserTimeBlock;
	hasNotification: boolean;
};

export function TimeBlockRow({ timeBlock, hasNotification }: TimeBlockRowProps) {
	const { sheetOpen, setSheetOpen, handleOpen } = useTimeBlockRow();
	const Icon = ICON_MAP[timeBlock.icon] ?? Clock;

	return (
		<>
			<Button
				variant="ghost"
				className="w-full justify-between min-h-11 px-md py-sm border-b border-edge-subtle last:border-0 hover:bg-surface-sunken active:scale-[0.98] transition-transform rounded-none"
				onClick={handleOpen}
			>
				<div className="flex items-center gap-sm">
					<Icon className="size-5 stroke-[1.5] text-content-muted shrink-0" />
					<span className="text-sm text-content font-medium">{timeBlock.name}</span>
				</div>
				<span className="text-sm text-content-faint">{timeBlock.startTime}</span>
			</Button>

			<TimeBlockEditSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				timeBlock={timeBlock}
				hasNotification={hasNotification}
			/>
		</>
	);
}
