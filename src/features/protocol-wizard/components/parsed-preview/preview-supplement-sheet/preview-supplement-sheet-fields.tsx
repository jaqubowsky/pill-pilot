"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { LabeledInput } from "@/shared/components/labeled-input";
import { LabeledSelect } from "@/shared/components/labeled-select";
import { TimeDurationInput } from "@/features/protocol-wizard/components/time-duration-input";
import { ToggleRow } from "@/shared/components/toggle-row";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";
import { cn } from "@/shared/lib/utils";
import type { PreviewSupplementSheetValues } from "./preview-supplement-sheet.schema";

type PreviewSupplementSheetFieldsProps = {
	timeBlocks: TimeBlockSummary[];
	readOnlyDosageUnit?: boolean;
	packageSize?: number | null;
	totalDailyDosage?: number;
};

export function PreviewSupplementSheetFields({
	timeBlocks,
	readOnlyDosageUnit,
	packageSize,
	totalDailyDosage,
}: PreviewSupplementSheetFieldsProps) {
	const t = useTranslations();

	const {
		register,
		watch,
		setValue,
		formState: { errors },
	} = useFormContext<PreviewSupplementSheetValues>();

	const category = watch("category");
	const isCritical = watch("isCritical");
	const cycleDaysOn = watch("cycleDaysOn");
	const startDayOffset = watch("startDayOffset");
	const durationDays = watch("durationDays");
	const dosageAmount = watch("dosageAmount");
	const dosageUnit = watch("dosageUnit");
	const timeBlockId = watch("timeBlockId");
	const dosageIntervalMinutes = watch("dosageIntervalMinutes");
	const waitAfterTakingMinutes = watch("waitAfterTakingMinutes");
	const finishPackage = watch("finishPackage");

	const isCycling = cycleDaysOn !== undefined;
	const hasOffset = startDayOffset !== undefined && startDayOffset !== 0;
	const hasDuration = durationDays !== undefined || !!finishPackage;
	const hasInterval = dosageIntervalMinutes !== undefined;
	const hasWaitAfter = waitAfterTakingMinutes !== undefined;
	const durationMode: "days" | "packages" = finishPackage ? "packages" : "days";

	const canUsePackageMode = packageSize !== null && packageSize !== undefined && packageSize > 0;

	const [packageCount, setPackageCount] = useState(() => {
		if (!finishPackage || !durationDays || !dosageAmount || !packageSize) return 1;
		return Math.max(1, Math.round((durationDays * dosageAmount) / packageSize));
	});

	const effectiveDailyDosage = totalDailyDosage ?? dosageAmount;

	function calcDaysFromPackages(count: number) {
		if (!packageSize || !effectiveDailyDosage || effectiveDailyDosage <= 0) return undefined;
		return Math.ceil((packageSize * count) / effectiveDailyDosage);
	}

	function handleDurationToggle(v: boolean) {
		if (v) {
			setValue("durationDays", 14);
			setValue("finishPackage", false);
		} else {
			setValue("durationDays", undefined);
			setValue("finishPackage", false);
		}
	}

	function handleDurationModeChange(mode: "days" | "packages") {
		if (mode === "packages") {
			setValue("finishPackage", true);
			const days = calcDaysFromPackages(packageCount);
			setValue("durationDays", days);
		} else {
			setValue("finishPackage", false);
			setValue("durationDays", durationDays ?? 14);
		}
	}

	function handlePackageCountChange(value: string) {
		const count = Math.max(1, parseInt(value, 10) || 1);
		setPackageCount(count);
		const days = calcDaysFromPackages(count);
		setValue("durationDays", days);
	}

	const hasAnyAdvanced =
		isCritical || isCycling || hasOffset || hasDuration || hasInterval || hasWaitAfter;
	const [advancedOpen, setAdvancedOpen] = useState(hasAnyAdvanced);

	return (
		<div className="flex flex-col gap-md">
			<LabeledInput
				label={t("supplement.name")}
				{...register("name")}
				placeholder={t("supplement.name")}
				error={errors.name?.message}
			/>

			<LabeledInput
				label={t("supplement.brand")}
				{...register("brandName")}
				placeholder={t("supplement.brand")}
			/>

			<LabeledSelect
				label={t("supplement.category")}
				value={category}
				onValueChange={(v) => setValue("category", v as PreviewSupplementSheetValues["category"])}
				displayValue={category ? t(`supplement.categories.${category}`) : t("supplement.category")}
			>
				{SUPPLEMENT_CATEGORIES.map((cat) => (
					<SelectItem key={cat} value={cat}>
						{t(`supplement.categories.${cat}`)}
					</SelectItem>
				))}
			</LabeledSelect>

			<div className="flex flex-col gap-xs">
				<Label className="text-sm text-content-muted">{t("schedule.dosage")}</Label>
				<div className="flex gap-sm min-w-0">
					<Input
						type="number"
						min="0.1"
						step="0.1"
						{...register("dosageAmount", { valueAsNumber: true })}
						className="w-20 shrink-0 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base"
					/>
					{readOnlyDosageUnit ? (
						<span className="text-sm text-content-muted self-center">
							{dosageUnit ? t(`schedule.units.${dosageUnit}`) : ""}
						</span>
					) : (
						<Select
							value={dosageUnit}
							onValueChange={(v) =>
								setValue("dosageUnit", v as PreviewSupplementSheetValues["dosageUnit"])
							}
						>
							<SelectTrigger className="flex-1 min-w-0 bg-surface-sunken border-edge rounded-lg">
								<SelectValue>{dosageUnit ? t(`schedule.units.${dosageUnit}`) : ""}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{DOSAGE_UNITS.map((u) => (
									<SelectItem key={u} value={u}>
										{t(`schedule.units.${u}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
			</div>

			<LabeledSelect
				label={t("schedule.block")}
				value={timeBlockId ?? ""}
				onValueChange={(v) => {
					if (v) setValue("timeBlockId", v);
				}}
				displayValue={timeBlocks.find((tb) => tb.id === timeBlockId)?.name ?? t("schedule.block")}
			>
				{timeBlocks.map((tb) => (
					<SelectItem key={tb.id} value={tb.id}>
						{tb.name}
					</SelectItem>
				))}
			</LabeledSelect>

			<LabeledInput
				label={t("schedule.notes")}
				{...register("notes")}
				placeholder={t("schedule.notes")}
			/>

			<button
				type="button"
				onClick={() => setAdvancedOpen((prev) => !prev)}
				className="flex items-center gap-xs text-sm font-medium text-content-muted min-h-11"
			>
				{advancedOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
				{t("schedule.advanced")}
			</button>

			<div
				className={cn(
					"flex flex-col gap-md overflow-hidden transition-[max-height] duration-250 ease-out",
					advancedOpen ? "max-h-[1000px]" : "max-h-0",
				)}
			>
				<ToggleRow
					label={t("supplement.criticalQuestion")}
					hint={t("supplement.criticalHint")}
					checked={isCritical}
					onCheckedChange={(v) => setValue("isCritical", v)}
				/>

				<ToggleRow
					label={t("schedule.cyclingQuestion")}
					hint={t("schedule.cyclingHint")}
					checked={isCycling}
					onCheckedChange={(v) => {
						if (v) {
							setValue("cycleDaysOn", 30);
							setValue("cycleDaysOff", 30);
						} else {
							setValue("cycleDaysOn", undefined);
							setValue("cycleDaysOff", undefined);
						}
					}}
				/>

				{isCycling && (
					<div className="flex gap-sm">
						<LabeledInput
							label={t("schedule.cycleDaysOn")}
							type="number"
							min="1"
							{...register("cycleDaysOn", { valueAsNumber: true })}
							className="flex-1"
						/>
						<LabeledInput
							label={t("schedule.cycleDaysOff")}
							type="number"
							min="1"
							{...register("cycleDaysOff", { valueAsNumber: true })}
							className="flex-1"
						/>
					</div>
				)}

				<ToggleRow
					label={t("schedule.delayedStartQuestion")}
					hint={t("schedule.delayedStartHint")}
					checked={hasOffset}
					onCheckedChange={(v) => {
						if (v) {
							setValue("startDayOffset", 14);
						} else {
							setValue("startDayOffset", undefined);
						}
					}}
				/>

				{hasOffset && (
					<LabeledInput
						label={t("schedule.startDayOffset")}
						type="number"
						min="1"
						{...register("startDayOffset", { valueAsNumber: true })}
					/>
				)}

				<ToggleRow
					label={t("schedule.limitedDurationQuestion")}
					hint={t("schedule.limitedDurationHint")}
					checked={hasDuration}
					onCheckedChange={handleDurationToggle}
				/>

				{hasDuration && (
					<div className="flex flex-col gap-sm">
						{canUsePackageMode && (
							<div className="flex rounded-lg border border-edge overflow-hidden">
								<button
									type="button"
									onClick={() => handleDurationModeChange("days")}
									className={cn(
										"flex-1 text-sm py-xs px-sm transition-colors",
										durationMode === "days"
											? "bg-brand-500 text-content-inverse font-medium"
											: "bg-surface-sunken text-content-muted",
									)}
								>
									{t("schedule.durationModeDays")}
								</button>
								<button
									type="button"
									onClick={() => handleDurationModeChange("packages")}
									className={cn(
										"flex-1 text-sm py-xs px-sm transition-colors",
										durationMode === "packages"
											? "bg-brand-500 text-content-inverse font-medium"
											: "bg-surface-sunken text-content-muted",
									)}
								>
									{t("schedule.durationModePackages")}
								</button>
							</div>
						)}

						{durationMode === "packages" && canUsePackageMode ? (
							<div className="flex flex-col gap-xs">
								<LabeledInput
									label={t("schedule.packageCount")}
									type="number"
									min="1"
									value={packageCount}
									onChange={(e) => handlePackageCountChange(e.target.value)}
								/>
								{durationDays && (
									<p className="text-xs text-content-faint">
										{t("schedule.packageDurationHint", {
											days: durationDays,
											amount: effectiveDailyDosage,
											unit: t(`schedule.units.${dosageUnit}`),
										})}
									</p>
								)}
							</div>
						) : (
							<LabeledInput
								label={t("schedule.durationDays")}
								type="number"
								min="1"
								{...register("durationDays", { valueAsNumber: true })}
							/>
						)}
					</div>
				)}

				<ToggleRow
					label={t("schedule.dosageIntervalQuestion")}
					hint={t("schedule.dosageIntervalHint")}
					checked={hasInterval}
					onCheckedChange={(v) => {
						if (v) {
							setValue("dosageIntervalMinutes", 360);
						} else {
							setValue("dosageIntervalMinutes", undefined);
						}
					}}
				/>

				{hasInterval && (
					<TimeDurationInput
						label={t("schedule.intervalTime")}
						value={dosageIntervalMinutes!}
						onChange={(v) => setValue("dosageIntervalMinutes", v)}
					/>
				)}

				<ToggleRow
					label={t("schedule.waitAfterTakingQuestion")}
					hint={t("schedule.waitAfterTakingHint")}
					checked={hasWaitAfter}
					onCheckedChange={(v) => {
						if (v) {
							setValue("waitAfterTakingMinutes", 30);
						} else {
							setValue("waitAfterTakingMinutes", undefined);
						}
					}}
				/>

				{hasWaitAfter && (
					<TimeDurationInput
						label={t("schedule.intervalTime")}
						value={waitAfterTakingMinutes!}
						onChange={(v) => setValue("waitAfterTakingMinutes", v)}
					/>
				)}
			</div>
		</div>
	);
}
