"use client";

import { useCallback, useState } from "react";
import type { ExistingSupplementSummary } from "@/features/protocol-wizard/types";

type UseExistingSupplementPickerParams = {
	supplements: ExistingSupplementSummary[];
	onOpenChange: (open: boolean) => void;
	onPick: (supplement: ExistingSupplementSummary) => void;
};

export function useExistingSupplementPicker({
	supplements,
	onOpenChange,
	onPick,
}: UseExistingSupplementPickerParams) {
	const [query, setQuery] = useState("");

	const filtered = query
		? supplements.filter((s) => {
				const label = s.name + (s.brandName ?? "");
				return label.toLowerCase().includes(query.toLowerCase());
			})
		: supplements;

	const handleOpenChange = useCallback(
		(next: boolean) => {
			onOpenChange(next);
			if (!next) setQuery("");
		},
		[onOpenChange],
	);

	const handlePick = useCallback(
		(supplement: ExistingSupplementSummary) => {
			onPick(supplement);
			setQuery("");
		},
		[onPick],
	);

	return { query, setQuery, filtered, handleOpenChange, handlePick };
}
