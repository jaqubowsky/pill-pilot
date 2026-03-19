"use client";

import { useMemo, useState } from "react";
import type { SupplementOption } from "../use-cart-price-sheet";

type Params = {
	supplements: SupplementOption[];
	value: string | null | undefined;
};

export function useSupplementPicker({ supplements, value }: Params) {
	const [isCreating, setIsCreating] = useState(false);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const selected = value ? (supplements.find((s) => s.id === value) ?? null) : null;

	const filtered = useMemo(() => {
		if (!query) return supplements;

		const q = query.toLowerCase();
		return supplements.filter((s) => {
			const label = s.name + (s.brandName ?? "");
			return label.toLowerCase().includes(q);
		});
	}, [supplements, query]);

	function selectAndClose(id: string | null, onChange: (id: string | null) => void) {
		onChange(id);
		setOpen(false);
		setQuery("");
	}

	return {
		isCreating,
		setIsCreating,
		open,
		setOpen,
		query,
		setQuery,
		selected,
		filtered,
		selectAndClose,
	};
}
