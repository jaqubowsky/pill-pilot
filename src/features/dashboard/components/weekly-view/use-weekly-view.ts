"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toDateString } from "@/shared/lib/date";

function getMondayOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	return d;
}

type Params = {
	startDate: string;
};

export function useWeeklyView({ startDate }: Params) {
	const router = useRouter();

	const parsedStart = useMemo(() => {
		const [y, mo, d] = startDate.split("-").map(Number);
		return new Date(y, mo - 1, d);
	}, [startDate]);

	const isCurrentWeek = useMemo(() => {
		const now = new Date();
		const currentMonday = getMondayOfWeek(now);
		return toDateString(currentMonday) === startDate;
	}, [startDate]);

	const goToPrevWeek = useCallback(() => {
		const d = new Date(parsedStart);
		d.setDate(d.getDate() - 7);
		router.replace(`/dashboard/weekly?start=${toDateString(d)}`);
	}, [parsedStart, router]);

	const goToNextWeek = useCallback(() => {
		const d = new Date(parsedStart);
		d.setDate(d.getDate() + 7);
		router.replace(`/dashboard/weekly?start=${toDateString(d)}`);
	}, [parsedStart, router]);

	const navigateToDay = useCallback(
		(date: string) => {
			const today = toDateString(new Date());
			router.push(date === today ? "/dashboard" : `/dashboard?date=${date}`);
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
