"use client";

import { useState } from "react";

export function useTimeBlocksSection() {
	const [addSheetOpen, setAddSheetOpen] = useState(false);

	function handleAddBlock() {
		setAddSheetOpen(true);
	}

	return { addSheetOpen, setAddSheetOpen, handleAddBlock };
}
