"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { DailyStatus } from "@/features/dashboard/api/queries/get-daily-status";
import { toDateString } from "@/shared/lib/date";

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
			const ds = toDateString(d);
			const today = toDateString(new Date());
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

	const isEmpty = status.timeBlocks.length === 0;

	return {
		parsedDate,
		isEmpty,
		goToPrevDay,
		goToNextDay,
		refresh,
	};
}
