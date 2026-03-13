"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StockList } from "@/features/stock/api/queries/get-stock-list";

export function useStockList(data: StockList) {
	const router = useRouter();
	const [addOpen, setAddOpen] = useState(false);

	const isEmpty = data.tracked.length === 0 && data.untracked.length === 0;

	function openAddSheet() {
		setAddOpen(true);
	}

	function navigateToOnboarding() {
		router.push("/onboarding");
	}

	return { isEmpty, addOpen, setAddOpen, openAddSheet, navigateToOnboarding };
}
