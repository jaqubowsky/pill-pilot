"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import type { IdentifiedSupplement } from "../../../lib/supplement-serialization";
import type { EditedSupplement } from "../parsed-preview.schema";
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
			isCritical: schedule?.isCritical ?? supplement?.isCritical ?? false,
			notes: schedule?.notes ?? supplement?.notes ?? undefined,
			cycleDaysOn: schedule?.cycleDaysOn ?? supplement?.cycleDaysOn ?? undefined,
			cycleDaysOff: schedule?.cycleDaysOff ?? supplement?.cycleDaysOff ?? undefined,
			startDayOffset: schedule?.startDayOffset ?? supplement?.startDayOffset ?? 0,
			durationDays: schedule?.durationDays ?? supplement?.durationDays ?? undefined,
			dosageIntervalMinutes: supplement?.dosageIntervalMinutes ?? undefined,
			waitAfterTakingMinutes:
				schedule?.waitAfterTakingMinutes ?? supplement?.waitAfterTakingMinutes ?? undefined,
			dosageAmount: schedule?.dosageAmount ?? 1,
			dosageUnit: schedule?.dosageUnit ?? DosageUnit.capsule,
			timeBlockId: schedule?.timeBlockId ?? defaultTimeBlockId ?? "",
			finishPackage: schedule?.finishPackage ?? false,
		},
	});

	useEffect(() => {
		methods.reset({
			name: supplement?.name ?? "",
			brandName: supplement?.brandName ?? undefined,
			category: supplement?.category ?? SupplementCategory.supplement,
			isCritical: schedule?.isCritical ?? supplement?.isCritical ?? false,
			notes: schedule?.notes ?? supplement?.notes ?? undefined,
			cycleDaysOn: schedule?.cycleDaysOn ?? supplement?.cycleDaysOn ?? undefined,
			cycleDaysOff: schedule?.cycleDaysOff ?? supplement?.cycleDaysOff ?? undefined,
			startDayOffset: schedule?.startDayOffset ?? supplement?.startDayOffset ?? 0,
			durationDays: schedule?.durationDays ?? supplement?.durationDays ?? undefined,
			dosageIntervalMinutes: supplement?.dosageIntervalMinutes ?? undefined,
			waitAfterTakingMinutes:
				schedule?.waitAfterTakingMinutes ?? supplement?.waitAfterTakingMinutes ?? undefined,
			dosageAmount: schedule?.dosageAmount ?? 1,
			dosageUnit: schedule?.dosageUnit ?? DosageUnit.capsule,
			timeBlockId: schedule?.timeBlockId ?? defaultTimeBlockId ?? "",
			finishPackage: schedule?.finishPackage ?? false,
		});
	}, [supplement, defaultTimeBlockId, methods.reset, schedule]);

	function handleSubmit(values: PreviewSupplementSheetValues) {
		const perScheduleFields = {
			notes: values.notes ?? null,
			isCritical: values.isCritical,
			waitAfterTakingMinutes: values.waitAfterTakingMinutes ?? null,
			cycleDaysOn: values.cycleDaysOn ?? null,
			cycleDaysOff: values.cycleDaysOff ?? null,
			startDayOffset: values.startDayOffset ?? 0,
			durationDays: values.durationDays ?? null,
			finishPackage: values.finishPackage ?? false,
		};

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
							...perScheduleFields,
						},
					]
				: supplement.schedules.map((s, i) =>
						i === scheduleIndex
							? {
									...s,
									dosageAmount: values.dosageAmount,
									dosageUnit: values.dosageUnit,
									timeBlockId: values.timeBlockId,
									...perScheduleFields,
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
