"use client";

import { useState } from "react";

export function useStockItem() {
	const [restockOpen, setRestockOpen] = useState(false);
	const [adjustOpen, setAdjustOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);

	return {
		restockOpen,
		setRestockOpen,
		adjustOpen,
		setAdjustOpen,
		editOpen,
		setEditOpen,
	};
}
