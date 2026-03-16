"use client";

import { useTranslations } from "next-intl";
import { FormProvider } from "react-hook-form";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import type { EditedSupplement } from "../parsed-preview.schema";
import type { IdentifiedSupplement } from "../use-parsed-preview";
import { PreviewSupplementSheetFields } from "./preview-supplement-sheet-fields";
import { usePreviewSupplementSheet } from "./use-preview-supplement-sheet";

type PreviewSupplementSheetProps = {
	supplement: IdentifiedSupplement | null;
	scheduleIndex: number;
	defaultTimeBlockId?: string;
	timeBlocks: TimeBlockSummary[];
	packageSize?: number | null;
	totalDailyDosage?: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (supplement: EditedSupplement) => void;
	title?: string;
};

const FORM_ID = "preview-supplement-form";

export function PreviewSupplementSheet({
	supplement,
	scheduleIndex,
	defaultTimeBlockId,
	timeBlocks,
	packageSize,
	totalDailyDosage,
	open,
	onOpenChange,
	onSave,
	title: titleOverride,
}: PreviewSupplementSheetProps) {
	const t = useTranslations();

	const { isNew, methods, handleSubmit } = usePreviewSupplementSheet({
		supplement,
		scheduleIndex,
		defaultTimeBlockId,
		onSave,
		onClose: () => onOpenChange(false),
	});

	const title =
		titleOverride ??
		(isNew ? t("protocolWizard.addSupplement") : t("protocolWizard.editSupplement"));

	return (
		<BottomSheet
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			scrollable
			footer={
				<Button
					type="submit"
					form={FORM_ID}
					variant="default"
					className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
				>
					{t("common.saveChanges")}
				</Button>
			}
		>
			<FormProvider {...methods}>
				<form id={FORM_ID} onSubmit={handleSubmit}>
					<PreviewSupplementSheetFields
						timeBlocks={timeBlocks}
						packageSize={packageSize}
						totalDailyDosage={totalDailyDosage}
					/>
				</form>
			</FormProvider>
		</BottomSheet>
	);
}
