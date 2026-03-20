"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { weeklySearchParams } from "@/features/dashboard/search-params";
import { getMondayOfWeek, parseDate, shiftDate, toDateString } from "@/shared/lib/date";

export function useWeeklyView() {
	const router = useRouter();
	const [start, setStart] = useQueryState("start", {
		...weeklySearchParams.start,
		shallow: false,
		clearOnDefault: false,
	});

	const parsedStart = useMemo(() => parseDate(start), [start]);

	const isCurrentWeek = useMemo(() => {
		return toDateString(getMondayOfWeek(new Date())) === start;
	}, [start]);

	const goToPrevWeek = useCallback(() => setStart(shiftDate(start, -7)), [start, setStart]);
	const goToNextWeek = useCallback(() => setStart(shiftDate(start, 7)), [start, setStart]);

	const navigateToDay = useCallback(
		(date: string) => {
			router.push(`/dashboard?date=${date}`);
		},
		[router],
	);

	return {
		parsedStart,
		isCurrentWeek,
		goToPrevWeek,
		goToNextWeek,
		navigateToDay,
	};
}
