"use client";

import { useState } from "react";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { useSheetState } from "../../hooks/use-sheet-state";
import { isAddSupplementAction } from "../../lib/resolve-sheet-save";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";
import type { EditedSupplement } from "../protocol-base/parsed-preview.schema";

export function useSupplementSheet({
	timeBlocks,
	initialSupplements = [],
}: {
	timeBlocks: TimeBlockSummary[];
	initialSupplements?: IdentifiedSupplement[];
}) {
	const defaultTimeBlockId = timeBlocks[0]?.id ?? "";
	const sheet = useSheetState(defaultTimeBlockId);

	const [supplements, setSupplements] = useState<IdentifiedSupplement[]>(initialSupplements);

	function handleSheetSave(edited: EditedSupplement) {
		if (sheet.sheetState === null) return;

		const state = sheet.sheetState;

		if (state.supplement !== null && !isAddSupplementAction(state)) {
			const id = state.supplement._id;
			setSupplements((prev) => prev.map((s) => (s._id === id ? { ...edited, _id: id } : s)));
		} else {
			const id = state.supplement?._id ?? crypto.randomUUID();
			setSupplements((prev) => [...prev, { ...edited, _id: id }]);
		}
	}

	function deleteSupplement(id: string) {
		setSupplements((prev) => prev.filter((s) => s._id !== id));
	}

	return {
		supplements,
		handleSheetSave,
		deleteSupplement,
		...sheet,
	};
}
