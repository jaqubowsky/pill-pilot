"use client";

import { useCallback, useState } from "react";
import type { ExistingSupplementSummary } from "@/features/protocol-wizard/types";
import { buildDefaultSupplement } from "../lib/supplement-defaults";
import type { IdentifiedSupplement } from "../lib/supplement-serialization";

export type SheetState = {
	supplement: IdentifiedSupplement | null;
	scheduleIndex: number;
	defaultTimeBlockId?: string;
	fromExisting?: boolean;
} | null;

export function useSheetState(defaultTimeBlockId: string) {
	const [sheetState, setSheetState] = useState<SheetState>(null);
	const [pickerOpen, setPickerOpen] = useState(false);

	const openAddSheet = useCallback(
		(timeBlockId?: string) => {
			setSheetState({
				supplement: null,
				scheduleIndex: 0,
				defaultTimeBlockId: timeBlockId ?? defaultTimeBlockId,
			});
		},
		[defaultTimeBlockId],
	);

	const openPicker = useCallback(() => {
		setPickerOpen(true);
	}, []);

	const openAddFromExisting = useCallback(
		(existing: ExistingSupplementSummary, timeBlockId?: string) => {
			setPickerOpen(false);
			const prefilled: IdentifiedSupplement = {
				...buildDefaultSupplement(timeBlockId ?? defaultTimeBlockId),
				name: existing.name,
				brandName: existing.brandName,
				existingSupplementId: existing.id,
				_id: crypto.randomUUID(),
			};
			setSheetState({
				supplement: prefilled,
				scheduleIndex: 0,
				fromExisting: true,
			});
		},
		[defaultTimeBlockId],
	);

	const openEditSheet = useCallback((supplement: IdentifiedSupplement, scheduleIndex = 0) => {
		setSheetState({ supplement, scheduleIndex });
	}, []);

	const closeSheet = useCallback(() => {
		setSheetState(null);
	}, []);

	return {
		sheetState,
		pickerOpen,
		setPickerOpen,
		openAddSheet,
		openPicker,
		openAddFromExisting,
		openEditSheet,
		closeSheet,
	};
}
