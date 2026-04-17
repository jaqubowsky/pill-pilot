"use client";

import { useState } from "react";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { useSheetState } from "../../hooks/use-sheet-state";
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

		if (sheet.sheetState.supplement === null) {
			setSupplements((prev) => [...prev, { ...edited, _id: crypto.randomUUID() }]);
		} else {
			const id = sheet.sheetState.supplement._id;
			const exists = supplements.some((s) => s._id === id);
			if (exists) {
				setSupplements((prev) => prev.map((s) => (s._id === id ? { ...edited, _id: id } : s)));
			} else {
				setSupplements((prev) => [...prev, { ...edited, _id: id }]);
			}
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
