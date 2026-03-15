"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { LabeledInput } from "@/shared/components/labeled-input";
import { LabeledSelect } from "@/shared/components/labeled-select";
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
import type { PreviewSupplementSheetValues } from "./preview-supplement-sheet.schema";

type PreviewSupplementSheetFieldsProps = {
	timeBlocks: TimeBlockSummary[];
};

export function PreviewSupplementSheetFields({ timeBlocks }: PreviewSupplementSheetFieldsProps) {
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
	const dosageUnit = watch("dosageUnit");
	const timeBlockId = watch("timeBlockId");

	const isCycling = cycleDaysOn !== undefined;
	const hasOffset = startDayOffset !== undefined && startDayOffset !== 0;
	const hasDuration = durationDays !== undefined;

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

			<ToggleRow
				label={t("supplement.critical")}
				hint={t("supplement.criticalHint")}
				checked={isCritical}
				onCheckedChange={(v) => setValue("isCritical", v)}
			/>

			<ToggleRow
				label={t("schedule.cycling")}
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
				label={t("schedule.delayedStart")}
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
				label={t("schedule.limitedDuration")}
				hint={t("schedule.limitedDurationHint")}
				checked={hasDuration}
				onCheckedChange={(v) => {
					if (v) {
						setValue("durationDays", 14);
					} else {
						setValue("durationDays", undefined);
					}
				}}
			/>

			{hasDuration && (
				<LabeledInput
					label={t("schedule.durationDays")}
					type="number"
					min="1"
					{...register("durationDays", { valueAsNumber: true })}
				/>
			)}

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
		</div>
	);
}
