"use client";

import {
	AlertTriangle,
	CheckCircle,
	Hourglass,
	Info,
	Lock,
	PackageCheck,
	Repeat,
	ShieldAlert,
	Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";
import { IconBadge } from "@/shared/components/icon-badge";
import { SupplementInfo } from "@/shared/components/supplement-info";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import type { SupplementCategory } from "@/shared/db/schema";
import { formatMinutes } from "@/shared/lib/format-minutes";
import { cn } from "@/shared/lib/utils";
import { formatRemainingTime } from "../../lib/format-remaining-time";
import { ScheduleDetailSheet } from "./schedule-detail-sheet";
import { SupplementCheckbox } from "./supplement-checkbox";
import { useSupplementRow } from "./use-supplement-row";

type Props = {
	entry: ScheduleEntry;
	date: string;
	initialChecked: boolean;
	protocolBorderColor: string;
	timeBlocks: { id: string; name: string; startTime: string }[];
	onCheckChange?: () => void;
};

export function SupplementRow({
	entry,
	date,
	initialChecked,
	protocolBorderColor,
	timeBlocks,
	onCheckChange,
}: Props) {
	const {
		scheduleId,
		supplementName,
		dosageAmount,
		dosageUnit,
		notes,
		isCritical,
		cycling,
		phase,
		isExpired,
		notStartedDays,
		stockStatus,
		finishPackage,
	} = entry;
	const t = useTranslations("dashboard");
	const ts = useTranslations("schedule");
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
		handleCloseConfirm,
	} = useSupplementRow({ scheduleId, date, initialChecked, hasTimer, onCheckChange });

	const [detailOpen, setDetailOpen] = useState(false);

	const packageInfo = entry.packageSize
		? `${entry.packageSize} ${t(`units.${entry.dosageUnit}`)}`
		: null;

	const isNotStarted = notStartedDays !== null && notStartedDays > 0;
	const isLocked = phase !== null && !phase.isUnlocked;
	const isOutOfStock = stockStatus !== null && stockStatus.currentStock === 0 && !finishPackage;
	const isLowStock =
		stockStatus !== null &&
		stockStatus.currentStock > 0 &&
		stockStatus.daysRemaining < 7 &&
		!finishPackage;
	const isCooldownActive = entry.cooldown !== null && entry.cooldown.remainingMs > 0;
	const hasWaitTimer = entry.waitTimer !== null && entry.waitTimer.remainingMs > 0;
	const isDisabled =
		isExpired ||
		isNotStarted ||
		isLocked ||
		isOutOfStock ||
		isCooldownActive ||
		(cycling !== null && !cycling.isOnPhase);

	return (
		<>
			<div
				className={cn(
					"flex items-center gap-sm rounded-lg border-t-[4px] pt-sm transition-opacity duration-150",
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
					label={supplementName}
				/>
				<SupplementInfo
					name={supplementName}
					brandName={entry.supplementBrandName}
					packageInfo={packageInfo}
					dosageAmount={dosageAmount}
					dosageUnit={dosageUnit}
					notes={notes}
					nameClassName={cn(
						checked && "text-content-faint line-through",
						isDisabled && "text-content-faint",
					)}
					badges={
						<>
							{isExpired && <IconBadge icon={CheckCircle} label={t("expired")} />}
							{!isExpired && (isNotStarted || isLocked) && (
								<IconBadge
									icon={Lock}
									label={
										isNotStarted
											? t("notStarted", { count: notStartedDays })
											: t("phaseLocked", { count: phase!.daysRemaining })
									}
								/>
							)}
							{isOutOfStock && (
								<IconBadge icon={AlertTriangle} variant="danger" label={t("outOfStock")} />
							)}
							{isLowStock && (
								<IconBadge
									icon={AlertTriangle}
									variant="amber"
									label={t("lowStock", {
										count: stockStatus!.currentStock,
										unit: t(`units.${stockStatus!.stockUnit}`),
									})}
								/>
							)}
							{isCritical && (
								<IconBadge icon={ShieldAlert} variant="danger" label={t("critical")} />
							)}
							{finishPackage && (
								<IconBadge
									icon={PackageCheck}
									label={
										entry.durationDays && entry.packageSize && entry.totalDailyDosage > 0
											? ts("finishPackageCountBadge", {
													count: Math.round(
														(entry.durationDays * entry.totalDailyDosage) / entry.packageSize,
													),
												})
											: ts("finishPackageBadge")
									}
								/>
							)}
							{cycling && !cycling.isOnPhase && (
								<IconBadge
									icon={Repeat}
									label={t("daysUntilResume", { count: cycling.daysRemaining })}
								/>
							)}
							{cycling?.isOnPhase && (
								<IconBadge
									icon={Repeat}
									label={t("daysUntilPause", { count: cycling.daysRemaining })}
								/>
							)}
							{isCooldownActive && (
								<IconBadge
									icon={Timer}
									variant="brand"
									label={t("cooldownRemaining", {
										time: formatRemainingTime(entry.cooldown!.remainingMs),
									})}
								/>
							)}
							{hasWaitTimer && (
								<IconBadge
									icon={Hourglass}
									variant="amber"
									label={t("waitRemaining", {
										time: formatRemainingTime(entry.waitTimer!.remainingMs),
									})}
								/>
							)}
							{!isCooldownActive && !hasWaitTimer && entry.dosageIntervalMinutes && (
								<IconBadge
									icon={Timer}
									variant="brand"
									label={ts("dosageIntervalBadge", {
										time: formatMinutes(entry.dosageIntervalMinutes),
									})}
								/>
							)}
							{!hasWaitTimer && entry.waitAfterTakingMinutes && (
								<IconBadge
									icon={Hourglass}
									variant="amber"
									label={ts("waitAfterTakingBadge", {
										time: formatMinutes(entry.waitAfterTakingMinutes),
									})}
								/>
							)}
						</>
					}
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
				supplementName={supplementName}
				brandName={entry.supplementBrandName}
				category={entry.supplementCategory as SupplementCategory}
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

			<Dialog open={timerPromptOpen} onOpenChange={setTimerPromptOpen}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>{t("timerPromptTitle")}</DialogTitle>
						<DialogDescription>
							{t("timerPromptDescription", {
								time: formatMinutes(
									entry.waitAfterTakingMinutes ?? entry.dosageIntervalMinutes ?? 0,
								),
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={() => handleTimerConfirm(true)}>
							{t("timerPromptSkip")}
						</Button>
						<Button onClick={() => handleTimerConfirm(false)}>{t("timerPromptStart")}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>{t("uncheckTitle")}</DialogTitle>
						<DialogDescription>{t("uncheckDescription")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={handleCloseConfirm}>
							{t("uncheckCancel")}
						</Button>
						<Button variant="destructive" onClick={handleConfirmUncheck}>
							{t("uncheckConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
