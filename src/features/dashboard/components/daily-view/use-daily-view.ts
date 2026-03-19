"use client";

import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import type { DailyStatus } from "@/features/dashboard/api/queries/get-daily-status";
import { dashboardSearchParams } from "@/features/dashboard/search-params";
import { parseDate, shiftDate } from "@/shared/lib/date";

type Params = {
	status: DailyStatus;
};

export function useDailyView({ status }: Params) {
	const [date, setDate] = useQueryState("date", {
		...dashboardSearchParams.date,
		shallow: false,
	});

	const parsedDate = useMemo(() => parseDate(date), [date]);

	const goToPrevDay = useCallback(() => setDate(shiftDate(date, -1)), [date, setDate]);
	const goToNextDay = useCallback(() => setDate(shiftDate(date, 1)), [date, setDate]);

	return {
		parsedDate,
		isEmpty: status.timeBlocks.length === 0,
		goToPrevDay,
		goToNextDay,
	};
}
