"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { FormProvider } from "react-hook-form";
import type { TimeBlockSummary } from "@/features/onboarding/types";
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
	allSupplements: IdentifiedSupplement[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (supplement: EditedSupplement) => void;
};

const FORM_ID = "preview-supplement-form";

export function PreviewSupplementSheet({
	supplement,
	scheduleIndex,
	defaultTimeBlockId,
	timeBlocks,
	allSupplements,
	open,
	onOpenChange,
	onSave,
}: PreviewSupplementSheetProps) {
	const t = useTranslations();

	const { isNew, methods, handleSubmit } = usePreviewSupplementSheet({
		supplement,
		scheduleIndex,
		defaultTimeBlockId,
		onSave,
		onClose: () => onOpenChange(false),
	});

	const prerequisiteOptions = useMemo(() => {
		const currentId = supplement?._id;
		return allSupplements
			.filter((s) => s._id !== currentId && s.prerequisiteLocalId !== currentId)
			.map((s) => ({ id: s._id, name: s.name }));
	}, [allSupplements, supplement]);

	return (
		<BottomSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isNew ? t("onboarding.addSupplement") : t("onboarding.editSupplement")}
			scrollable
		>
			<FormProvider {...methods}>
				<form id={FORM_ID} onSubmit={handleSubmit}>
					<PreviewSupplementSheetFields
						timeBlocks={timeBlocks}
						prerequisiteOptions={prerequisiteOptions}
					/>
				</form>
			</FormProvider>

			<div className="flex flex-col gap-sm mt-lg">
				<Button
					type="submit"
					form={FORM_ID}
					variant="default"
					className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
				>
					{t("common.saveChanges")}
				</Button>
			</div>
		</BottomSheet>
	);
}
