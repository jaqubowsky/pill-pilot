"use client";

import { useTranslations } from "next-intl";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import type { SupplementCategory } from "@/shared/db/schema";
import { formatMinutes } from "@/shared/lib/format-minutes";

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

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-sm py-sm">
			<span className="text-sm text-content-muted shrink-0">{label}</span>
			<span className="text-sm text-content text-right">{value}</span>
		</div>
	);
}

function DetailTag({ label }: { label: string }) {
	return (
		<span className="inline-flex items-center rounded-md bg-surface-sunken px-sm py-xs text-xs font-medium text-content-muted">
			{label}
		</span>
	);
}

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

	const hasCycling = cycleDaysOn != null && cycleDaysOff != null;
	const hasOffset = startDayOffset > 0;
	const hasDuration = durationDays != null;
	const hasInterval = dosageIntervalMinutes != null;
	const hasWait = waitAfterTakingMinutes != null;
	const hasAdvanced = hasCycling || hasOffset || hasDuration || hasInterval || hasWait;

	const tags = [
		isCritical && t("supplement.critical"),
		finishPackage && t("schedule.finishPackageBadge"),
	].filter(Boolean) as string[];

	return (
		<BottomSheet open={open} onOpenChange={onOpenChange} title={supplementName} scrollable>
			<div className="flex flex-col gap-md">
				<div className="flex flex-col">
					{brandName && <DetailRow label={t("supplement.brand")} value={brandName} />}
					<DetailRow
						label={t("supplement.category")}
						value={t(`supplement.categories.${category}`)}
					/>
					<DetailRow
						label={t("schedule.dosage")}
						value={`${dosageAmount} ${t(`schedule.units.${dosageUnit}`)}`}
					/>
					<DetailRow label={t("schedule.block")} value={timeBlockName} />
					{packageSize != null && packageSize > 0 && (
						<DetailRow
							label={t("supplement.packageSize")}
							value={`${packageSize} ${t(`schedule.units.${dosageUnit}`)}`}
						/>
					)}
					{notes && <DetailRow label={t("schedule.notes")} value={notes} />}
				</div>

				{tags.length > 0 && (
					<div className="flex flex-wrap gap-xs">
						{tags.map((tag) => (
							<DetailTag key={tag} label={tag} />
						))}
					</div>
				)}

				{hasAdvanced && (
					<div className="flex flex-col border-t border-edge-subtle pt-md">
						{hasCycling && (
							<DetailRow
								label={t("schedule.cycling")}
								value={t("schedule.cyclingLabel", {
									on: cycleDaysOn,
									off: cycleDaysOff,
								})}
							/>
						)}
						{hasOffset && (
							<DetailRow
								label={t("schedule.delayedStart")}
								value={t("schedule.startDayOffsetBadge", { count: startDayOffset })}
							/>
						)}
						{hasDuration && (
							<DetailRow
								label={t("schedule.limitedDuration")}
								value={t("schedule.durationBadge", { count: durationDays })}
							/>
						)}
						{hasInterval && (
							<DetailRow
								label={t("schedule.dosageInterval")}
								value={formatMinutes(dosageIntervalMinutes!)}
							/>
						)}
						{hasWait && (
							<DetailRow
								label={t("schedule.waitAfterTaking")}
								value={formatMinutes(waitAfterTakingMinutes!)}
							/>
						)}
					</div>
				)}
			</div>
		</BottomSheet>
	);
}
