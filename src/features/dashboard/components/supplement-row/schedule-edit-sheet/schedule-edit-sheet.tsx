"use client";

import { useTranslations } from "next-intl";
import { FormProvider } from "react-hook-form";
import type { PreviewSupplementSheetValues } from "@/features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/preview-supplement-sheet.schema";
import { PreviewSupplementSheetFields } from "@/features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/preview-supplement-sheet-fields";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
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

	const { methods, handleSubmit, isPending } = useScheduleEditSheet({
		scheduleId,
		defaultValues,
		onClose: () => onOpenChange(false),
	});

	return (
		<BottomSheet
			open={open}
			onOpenChange={onOpenChange}
			title={supplementName}
			scrollable
			footer={
				<Button
					type="submit"
					form={FORM_ID}
					disabled={isPending}
					className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
				>
					{t("common.saveChanges")}
				</Button>
			}
		>
			<FormProvider {...methods}>
				<form id={FORM_ID} onSubmit={handleSubmit}>
					<PreviewSupplementSheetFields timeBlocks={timeBlocks} />
				</form>
			</FormProvider>
		</BottomSheet>
	);
}
