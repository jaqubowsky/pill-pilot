"use client";

import { useTranslations } from "next-intl";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import type { SupplementCategory } from "@/shared/db/schema";
import { DetailTag } from "./detail-tag";
import { ScheduleAdvancedDetails } from "./schedule-advanced-details";
import { ScheduleMainDetails } from "./schedule-main-details";

type ScheduleDetailSheetProps = {
	supplementName: string;
	brandName?: string | null;
	category: SupplementCategory;
	dosageAmount: number;
	dosageUnit: string;
	timeBlockName: string;
	notes?: string | null;
	isCritical: boolean;
	cycleDaysOn?: number | null;
	cycleDaysOff?: number | null;
	startDayOffset: number;
	durationDays?: number | null;
	dosageIntervalMinutes?: number | null;
	waitAfterTakingMinutes?: number | null;
	finishPackage: boolean;
	packageSize?: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ScheduleDetailSheet({
	supplementName,
	brandName,
	category,
	dosageAmount,
	dosageUnit,
	timeBlockName,
	notes,
	isCritical,
	cycleDaysOn,
	cycleDaysOff,
	startDayOffset,
	durationDays,
	dosageIntervalMinutes,
	waitAfterTakingMinutes,
	finishPackage,
	packageSize,
	open,
	onOpenChange,
}: ScheduleDetailSheetProps) {
	const t = useTranslations();

	const tags = [
		isCritical ? t("supplement.critical") : null,
		finishPackage ? t("schedule.finishPackageBadge") : null,
	].filter((tag): tag is string => tag !== null);

	return (
		<BottomSheet open={open} onOpenChange={onOpenChange} title={supplementName} scrollable>
			<div className="flex flex-col gap-md">
				<ScheduleMainDetails
					brandName={brandName}
					category={category}
					dosageAmount={dosageAmount}
					dosageUnit={dosageUnit}
					timeBlockName={timeBlockName}
					notes={notes}
					packageSize={packageSize}
				/>

				{tags.length > 0 && (
					<div className="flex flex-wrap gap-xs">
						{tags.map((tag) => (
							<DetailTag key={tag} label={tag} />
						))}
					</div>
				)}

				<ScheduleAdvancedDetails
					cycleDaysOn={cycleDaysOn}
					cycleDaysOff={cycleDaysOff}
					startDayOffset={startDayOffset}
					durationDays={durationDays}
					dosageIntervalMinutes={dosageIntervalMinutes}
					waitAfterTakingMinutes={waitAfterTakingMinutes}
				/>
			</div>
		</BottomSheet>
	);
}
