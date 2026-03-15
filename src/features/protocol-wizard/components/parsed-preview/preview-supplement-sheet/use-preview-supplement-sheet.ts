"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import type { EditedSupplement } from "../parsed-preview.schema";
import type { IdentifiedSupplement } from "../use-parsed-preview";
import {
	type PreviewSupplementSheetValues,
	previewSupplementSheetSchema,
} from "./preview-supplement-sheet.schema";

type UsePreviewSupplementSheetParams = {
	supplement: IdentifiedSupplement | null;
	scheduleIndex: number;
	defaultTimeBlockId?: string;
	onSave: (supplement: EditedSupplement) => void;
	onClose: () => void;
};

export function usePreviewSupplementSheet({
	supplement,
	scheduleIndex,
	defaultTimeBlockId,
	onSave,
	onClose,
}: UsePreviewSupplementSheetParams) {
	const isNew = supplement === null;
	const schedule = supplement?.schedules[scheduleIndex];

	const methods = useForm<PreviewSupplementSheetValues>({
		resolver: zodResolver(previewSupplementSheetSchema),
		defaultValues: {
			name: supplement?.name ?? "",
			brandName: supplement?.brandName ?? undefined,
			category: supplement?.category ?? SupplementCategory.supplement,
			isCritical: supplement?.isCritical ?? false,
			notes: supplement?.notes ?? undefined,
			cycleDaysOn: supplement?.cycleDaysOn ?? undefined,
			cycleDaysOff: supplement?.cycleDaysOff ?? undefined,
			startDayOffset: supplement?.startDayOffset ?? 0,
			durationDays: supplement?.durationDays ?? undefined,
			dosageIntervalMinutes: supplement?.dosageIntervalMinutes ?? undefined,
			waitAfterTakingMinutes: supplement?.waitAfterTakingMinutes ?? undefined,
			dosageAmount: schedule?.dosageAmount ?? 1,
			dosageUnit: schedule?.dosageUnit ?? DosageUnit.capsule,
			timeBlockId: schedule?.timeBlockId ?? defaultTimeBlockId ?? "",
		},
	});

	useEffect(() => {
		methods.reset({
			name: supplement?.name ?? "",
			brandName: supplement?.brandName ?? undefined,
			category: supplement?.category ?? SupplementCategory.supplement,
			isCritical: supplement?.isCritical ?? false,
			notes: supplement?.notes ?? undefined,
			cycleDaysOn: supplement?.cycleDaysOn ?? undefined,
			cycleDaysOff: supplement?.cycleDaysOff ?? undefined,
			startDayOffset: supplement?.startDayOffset ?? 0,
			durationDays: supplement?.durationDays ?? undefined,
			dosageIntervalMinutes: supplement?.dosageIntervalMinutes ?? undefined,
			waitAfterTakingMinutes: supplement?.waitAfterTakingMinutes ?? undefined,
			dosageAmount: schedule?.dosageAmount ?? 1,
			dosageUnit: schedule?.dosageUnit ?? DosageUnit.capsule,
			timeBlockId: schedule?.timeBlockId ?? defaultTimeBlockId ?? "",
		});
	}, [
		supplement,
		defaultTimeBlockId,
		methods.reset,
		schedule?.dosageAmount,
		schedule?.dosageUnit,
		schedule?.timeBlockId,
	]);

	function handleSubmit(values: PreviewSupplementSheetValues) {
		const editedSupplement: EditedSupplement = {
			name: values.name,
			existingSupplementId: supplement?.existingSupplementId ?? null,
			brandName: values.brandName ?? null,
			category: values.category,
			isCritical: values.isCritical,
			notes: values.notes ?? null,
			cycleDaysOn: values.cycleDaysOn ?? null,
			cycleDaysOff: values.cycleDaysOff ?? null,
			startDayOffset: values.startDayOffset ?? 0,
			durationDays: values.durationDays ?? null,
			dosageIntervalMinutes: values.dosageIntervalMinutes ?? null,
			waitAfterTakingMinutes: values.waitAfterTakingMinutes ?? null,
			confidence: 1,
			uncertaintyReason: null,
			schedules: isNew
				? [
						{
							dosageAmount: values.dosageAmount,
							dosageUnit: values.dosageUnit,
							timeBlockId: values.timeBlockId,
						},
					]
				: supplement.schedules.map((s, i) =>
						i === scheduleIndex
							? {
									...s,
									dosageAmount: values.dosageAmount,
									dosageUnit: values.dosageUnit,
									timeBlockId: values.timeBlockId,
								}
							: s,
					),
		};

		onSave(editedSupplement);
		onClose();
	}

	return {
		isNew,
		methods,
		handleSubmit: methods.handleSubmit(handleSubmit),
	};
}
