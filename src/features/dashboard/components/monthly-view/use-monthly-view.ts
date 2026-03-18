"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { monthlySearchParams } from "@/features/dashboard/search-params";
import {
	getFirstDayOfWeek,
	shiftYearMonth,
	toDateString,
	toMonthLabel,
	toYearMonth,
} from "@/shared/lib/date";

export function useMonthlyView() {
	const router = useRouter();
	const [yearMonth, setYearMonth] = useQueryState("month", monthlySearchParams.month);

	const isCurrentMonth = useMemo(() => toYearMonth(new Date()) === yearMonth, [yearMonth]);
	const monthLabel = useMemo(() => toMonthLabel(yearMonth), [yearMonth]);
	const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(yearMonth), [yearMonth]);

	const goToPrevMonth = useCallback(() => setYearMonth(shiftYearMonth(yearMonth, -1)), [yearMonth, setYearMonth]);
	const goToNextMonth = useCallback(() => setYearMonth(shiftYearMonth(yearMonth, 1)), [yearMonth, setYearMonth]);

	const navigateToDay = useCallback(
		(date: string) => {
			const today = toDateString(new Date());
			router.push(date === today ? "/dashboard" : `/dashboard?date=${date}`);
		},
		[router],
	);

	return {
		isCurrentMonth,
		monthLabel,
		firstDayOfWeek,
		goToPrevMonth,
		goToNextMonth,
		navigateToDay,
	};
}
