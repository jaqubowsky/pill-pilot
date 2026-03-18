"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
	ScheduleEntry,
	TimeBlockSummary,
} from "@/features/dashboard/api/queries/get-daily-status";
import { SupplementInfo } from "@/shared/components/supplement-info";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { ScheduleDetailSheet } from "./schedule-detail-sheet";
import { SupplementBadges } from "./supplement-badges";
import { SupplementCheckbox } from "./supplement-checkbox";
import { TimerPromptDialog } from "./timer-prompt-dialog";
import { UncheckDialog } from "./uncheck-dialog";
import { useSupplementRow } from "./use-supplement-row";

type Props = {
	entry: ScheduleEntry;
	initialChecked: boolean;
	protocolBorderColor: string;
	timeBlocks: TimeBlockSummary[];
};

export function SupplementRow({ entry, initialChecked, protocolBorderColor, timeBlocks }: Props) {
	const t = useTranslations("dashboard");
	const hasTimer = entry.dosageIntervalMinutes !== null || entry.waitAfterTakingMinutes !== null;
	const {
		checked,
		pending,
		confirmOpen,
		setConfirmOpen,
		timerPromptOpen,
		setTimerPromptOpen,
		handleClick,
		handleTimerConfirm,
		handleConfirmUncheck,
	} = useSupplementRow({ scheduleId: entry.scheduleId, initialChecked, hasTimer });

	const [detailOpen, setDetailOpen] = useState(false);

	const isDisabled =
		entry.isExpired ||
		(entry.notStartedDays !== null && entry.notStartedDays > 0) ||
		(entry.phase !== null && !entry.phase.isUnlocked) ||
		(entry.stockStatus !== null && entry.stockStatus.currentStock === 0 && !entry.finishPackage) ||
		(entry.cooldown !== null && entry.cooldown.remainingMs > 0) ||
		(entry.cycling !== null && !entry.cycling.isOnPhase);

	const packageInfo = entry.packageSize
		? `${entry.packageSize} ${t(`units.${entry.dosageUnit}`)}`
		: null;

	return (
		<>
			<div
				className={cn(
					"flex items-center gap-sm rounded-lg border-t-4 pt-sm transition-opacity duration-150",
					pending && "opacity-85",
					isDisabled && "opacity-50",
				)}
				style={{ borderTopColor: protocolBorderColor }}
			>
				<SupplementCheckbox
					checked={checked}
					pending={pending}
					disabled={isDisabled}
					onClick={handleClick}
					label={entry.supplementName}
				/>
				<SupplementInfo
					name={entry.supplementName}
					brandName={entry.supplementBrandName}
					packageInfo={packageInfo}
					dosageAmount={entry.dosageAmount}
					dosageUnit={entry.dosageUnit}
					notes={entry.notes}
					nameClassName={cn(
						checked && "text-content-faint line-through",
						isDisabled && "text-content-faint",
					)}
					badges={<SupplementBadges entry={entry} />}
				/>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => setDetailOpen(true)}
					className="shrink-0 text-content-faint hover:text-content-muted"
				>
					<Info className="size-3.5" />
				</Button>
			</div>

			<ScheduleDetailSheet
				supplementName={entry.supplementName}
				brandName={entry.supplementBrandName}
				category={entry.supplementCategory}
				dosageAmount={Number(entry.dosageAmount)}
				dosageUnit={entry.dosageUnit}
				timeBlockName={timeBlocks.find((tb) => tb.id === entry.timeBlockId)?.name ?? ""}
				notes={entry.notes}
				isCritical={entry.isCritical}
				cycleDaysOn={entry.cycleDaysOn}
				cycleDaysOff={entry.cycleDaysOff}
				startDayOffset={entry.startDayOffset}
				durationDays={entry.durationDays}
				dosageIntervalMinutes={entry.dosageIntervalMinutes}
				waitAfterTakingMinutes={entry.waitAfterTakingMinutes}
				finishPackage={entry.finishPackage}
				packageSize={entry.packageSize}
				open={detailOpen}
				onOpenChange={setDetailOpen}
			/>

			<TimerPromptDialog
				open={timerPromptOpen}
				onOpenChange={setTimerPromptOpen}
				onConfirm={handleTimerConfirm}
				timerMinutes={entry.waitAfterTakingMinutes ?? entry.dosageIntervalMinutes ?? 0}
			/>

			<UncheckDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				onConfirm={handleConfirmUncheck}
			/>
		</>
	);
}
