"use client";

import { useState } from "react";

export function useTimeBlockRow() {
	const [sheetOpen, setSheetOpen] = useState(false);

	function handleOpen() {
		setSheetOpen(true);
	}

	return { sheetOpen, setSheetOpen, handleOpen };
}
