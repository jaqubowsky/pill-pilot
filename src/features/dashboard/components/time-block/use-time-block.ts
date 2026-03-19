"use client";

import { useState } from "react";
import type { TimeBlockStatus } from "@/features/dashboard/api/queries/get-daily-status";
import { getUncheckedIds } from "@/features/dashboard/lib/checkable-entries";

type Params = {
	block: TimeBlockStatus;
	defaultOpen: boolean;
};

export function useTimeBlock({ block, defaultOpen }: Params) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const uncheckedIds = getUncheckedIds(block.entries);

	function toggleOpen() {
		setIsOpen((prev) => !prev);
	}

	return {
		isOpen,
		uncheckedIds,
		toggleOpen,
	};
}
