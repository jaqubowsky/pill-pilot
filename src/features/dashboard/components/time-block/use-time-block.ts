"use client";

import { useState } from "react";
import type { TimeBlockStatus } from "@/features/dashboard/api/queries/get-daily-status";

type Params = {
	block: TimeBlockStatus;
	defaultOpen: boolean;
};

export function useTimeBlock({ block, defaultOpen }: Params) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const checkableEntries = block.entries.filter((e) => {
		if (e.isExpired) return false;
		if (e.notStartedDays !== null && e.notStartedDays > 0) return false;
		if (e.phase !== null && !e.phase.isUnlocked) return false;
		if (e.cycling !== null && !e.cycling.isOnPhase) return false;
		if (e.stockStatus !== null && e.stockStatus.currentStock === 0) return false;
		if (e.cooldown !== null && e.cooldown.remainingMs > 0) return false;
		return true;
	});
	const uncheckedIds = checkableEntries.filter((e) => !e.logId).map((e) => e.scheduleId);
	const allScheduleIds = checkableEntries.map((e) => e.scheduleId);

	function toggleOpen() {
		setIsOpen((prev) => !prev);
	}

	return {
		isOpen,
		uncheckedIds,
		allScheduleIds,
		toggleOpen,
	};
}
