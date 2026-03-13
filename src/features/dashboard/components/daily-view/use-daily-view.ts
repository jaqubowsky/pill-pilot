"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DailyStatus } from "@/features/dashboard/api/queries/get-daily-status";

function toLocalDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function getActiveBlockIndex(timeBlocks: { startTime: string }[]): number {
	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	let activeIndex = 0;
	for (let i = 0; i < timeBlocks.length; i++) {
		const [h, m] = timeBlocks[i].startTime.split(":").map(Number);
		if (h * 60 + m <= currentMinutes) {
			activeIndex = i;
		}
	}
	return activeIndex;
}

type Params = {
	date: string;
	status: DailyStatus;
};

export function useDailyView({ date, status }: Params) {
	const router = useRouter();

	const parsedDate = useMemo(() => {
		const [y, mo, d] = date.split("-").map(Number);
		return new Date(y, mo - 1, d);
	}, [date]);

	const navigateToDate = useCallback(
		(d: Date) => {
			const ds = toLocalDateString(d);
			const today = toLocalDateString(new Date());
			router.replace(ds === today ? "/dashboard" : `/dashboard?date=${ds}`);
		},
		[router],
	);

	const goToPrevDay = useCallback(() => {
		const d = new Date(parsedDate);
		d.setDate(d.getDate() - 1);
		navigateToDate(d);
	}, [parsedDate, navigateToDate]);

	const goToNextDay = useCallback(() => {
		const d = new Date(parsedDate);
		d.setDate(d.getDate() + 1);
		navigateToDate(d);
	}, [parsedDate, navigateToDate]);

	const refresh = useCallback(() => {
		router.refresh();
	}, [router]);

	const activeBlockIndex = getActiveBlockIndex(status.timeBlocks);

	function isBlockDefaultOpen(index: number): boolean {
		return activeBlockIndex === index;
	}

	const isEmpty = status.timeBlocks.length === 0;

	return {
		parsedDate,
		isEmpty,
		goToPrevDay,
		goToNextDay,
		isBlockDefaultOpen,
		refresh,
	};
}
