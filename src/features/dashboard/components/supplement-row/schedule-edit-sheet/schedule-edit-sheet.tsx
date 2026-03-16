"use client";

import { useTranslations } from "next-intl";
import { FormProvider } from "react-hook-form";
import type { PreviewSupplementSheetValues } from "@/features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/preview-supplement-sheet.schema";
import { PreviewSupplementSheetFields } from "@/features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/preview-supplement-sheet-fields";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useScheduleEditSheet } from "./use-schedule-edit-sheet";

type ScheduleEditSheetProps = {
	scheduleId: string;
	supplementName: string;
	defaultValues: PreviewSupplementSheetValues;
	timeBlocks: { id: string; name: string; startTime: string }[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const FORM_ID = "schedule-edit-form";

export function ScheduleEditSheet({
	scheduleId,
	supplementName,
	defaultValues,
	timeBlocks,
	open,
	onOpenChange,
}: ScheduleEditSheetProps) {
	const t = useTranslations();

	const {
		methods,
		handleSubmit,
		isPending,
		showSiblings,
		hideForm,
		siblings,
		changedFields,
		handleApplyToAll,
		handleSkipSiblings,
	} = useScheduleEditSheet({
		scheduleId,
		defaultValues,
		onClose: () => onOpenChange(false),
	});

	const sheetOpen = open || showSiblings;

	return (
		<BottomSheet
			open={sheetOpen}
			onOpenChange={(v) => {
				if (!v && showSiblings) return;
				onOpenChange(v);
			}}
			title={showSiblings ? t("schedule.updateSiblingsTitle") : supplementName}
			description={
				showSiblings ? t("schedule.updateSiblingsDescription", { name: supplementName }) : undefined
			}
			scrollable
			footer={
				showSiblings ? (
					<div className="flex gap-sm">
						<Button variant="outline" className="flex-1" onClick={handleSkipSiblings}>
							{t("schedule.updateSiblingsSkip")}
						</Button>
						<Button
							className="flex-1 bg-brand-500 text-content-inverse"
							onClick={handleApplyToAll}
							disabled={isPending}
						>
							{t("schedule.updateSiblingsApply")}
						</Button>
					</div>
				) : (
					<Button
						type="submit"
						form={FORM_ID}
						disabled={isPending}
						className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
					>
						{t("common.saveChanges")}
					</Button>
				)
			}
		>
			<div className={cn(hideForm && "hidden")}>
				<FormProvider {...methods}>
					<form id={FORM_ID} onSubmit={handleSubmit}>
						<PreviewSupplementSheetFields timeBlocks={timeBlocks} readOnlyDosageUnit />
					</form>
				</FormProvider>
			</div>

			<div className={cn(!showSiblings && "hidden", "flex flex-col gap-md")}>
				{changedFields && changedFields.length > 0 && (
					<div className="flex flex-col gap-xs">
						<span className="text-sm font-medium text-content">
							{t("schedule.updateSiblingsChangedFields")}
						</span>
						<ul className="flex flex-col gap-xs">
							{changedFields.map((field) => (
								<li key={field} className="text-sm text-content-muted">
									• {t(`schedule.fieldLabels.${field}`)}
								</li>
							))}
						</ul>
					</div>
				)}
				{siblings && (
					<div className="flex flex-col gap-xs">
						<span className="text-sm font-medium text-content">
							{t("schedule.updateSiblingsAffected")}
						</span>
						<ul className="flex flex-col gap-xs">
							{siblings.map((s) => (
								<li key={s.timeBlockName} className="text-sm text-content-muted">
									• {supplementName} — {s.timeBlockName}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</BottomSheet>
	);
}
