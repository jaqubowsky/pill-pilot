"use client";

import { AlertTriangle, CheckCircle, Lock, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StockStatus } from "@/features/dashboard/api/queries/get-daily-status";
import { CriticalBadge } from "@/shared/components/critical-badge";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { formatQuantity } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { SupplementCheckbox } from "./supplement-checkbox";
import { useSupplementRow } from "./use-supplement-row";

type Props = {
	scheduleId: string;
	date: string;
	supplementName: string;
	dosageAmount: string;
	dosageUnit: string;
	notes: string | null;
	isCritical: boolean;
	initialChecked: boolean;
	cycling: { isOnPhase: boolean; daysRemaining: number } | null;
	dependency: { isUnlocked: boolean; daysRemaining: number } | null;
	isExpired: boolean;
	notStartedDays: number | null;
	stockStatus: StockStatus | null;
	protocolBorderColor: string;
	onCheckChange?: () => void;
};

export function SupplementRow({
	scheduleId,
	date,
	supplementName,
	dosageAmount,
	dosageUnit,
	notes,
	isCritical,
	initialChecked,
	cycling,
	dependency,
	isExpired,
	notStartedDays,
	stockStatus,
	protocolBorderColor,
	onCheckChange,
}: Props) {
	const t = useTranslations("dashboard");
	const {
		checked,
		pending,
		confirmOpen,
		setConfirmOpen,
		handleClick,
		handleConfirmUncheck,
		handleCloseConfirm,
	} = useSupplementRow({ scheduleId, date, initialChecked, onCheckChange });

	const isNotStarted = notStartedDays !== null && notStartedDays > 0;
	const isLocked = dependency !== null && !dependency.isUnlocked;
	const isOutOfStock = stockStatus !== null && stockStatus.currentStock === 0;
	const isLowStock =
		stockStatus !== null && stockStatus.currentStock > 0 && stockStatus.daysRemaining < 7;
	const isDisabled =
		isExpired ||
		isNotStarted ||
		isLocked ||
		isOutOfStock ||
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
				<div className="flex flex-1 flex-col gap-xs">
					<div className="flex items-center gap-sm">
						{isExpired && (
							<Popover>
								<PopoverTrigger className="text-content-faint">
									<CheckCircle className="size-3.5" />
								</PopoverTrigger>
								<PopoverContent className="text-xs w-64">{t("expired")}</PopoverContent>
							</Popover>
						)}
						{!isExpired && (isNotStarted || isLocked) && (
							<Popover>
								<PopoverTrigger className="text-content-faint">
									<Lock className="size-3.5" />
								</PopoverTrigger>
								<PopoverContent className="text-xs w-64">
									{isNotStarted
										? t("notStarted", { count: notStartedDays })
										: t("dependencyLocked", {
												count: dependency!.daysRemaining,
											})}
								</PopoverContent>
							</Popover>
						)}
						{isOutOfStock && (
							<Popover>
								<PopoverTrigger className="text-destructive">
									<AlertTriangle className="size-3.5" />
								</PopoverTrigger>
								<PopoverContent className="text-xs w-64">{t("outOfStock")}</PopoverContent>
							</Popover>
						)}
						{isLowStock && (
							<Popover>
								<PopoverTrigger className="text-amber-500">
									<AlertTriangle className="size-3.5" />
								</PopoverTrigger>
								<PopoverContent className="text-xs w-64">
									{t("lowStock", {
										count: stockStatus!.currentStock,
										unit: t(`units.${stockStatus!.stockUnit}`),
									})}
								</PopoverContent>
							</Popover>
						)}
						<span
							className={cn(
								"text-sm font-medium text-content transition-colors",
								checked && "text-content-faint line-through",
								isDisabled && "text-content-faint",
							)}
						>
							{supplementName}
						</span>
						{isCritical && <CriticalBadge />}
					</div>
					<span className="text-xs text-content-faint">
						{formatQuantity(dosageAmount)} {t(`units.${dosageUnit}`)}
						{notes && <> &middot; {notes}</>}
					</span>
					{cycling && !cycling.isOnPhase && (
						<span className="text-xs text-content-faint">
							{t("daysUntilResume", { count: cycling.daysRemaining })}
						</span>
					)}
					{cycling && cycling.isOnPhase && (
						<span className="flex items-center gap-xs text-xs text-content-faint">
							<Repeat className="size-3" />
							{t("daysUntilPause", { count: cycling.daysRemaining })}
						</span>
					)}
				</div>
			</div>

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
