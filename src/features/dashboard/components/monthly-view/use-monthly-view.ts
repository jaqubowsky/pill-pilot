"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

type Params = {
	yearMonth: string;
};

export function useMonthlyView({ yearMonth }: Params) {
	const router = useRouter();

	const [year, month] = useMemo(() => yearMonth.split("-").map(Number), [yearMonth]);

	const isCurrentMonth = useMemo(() => {
		const now = new Date();
		return now.getFullYear() === year && now.getMonth() + 1 === month;
	}, [year, month]);

	const monthLabel = useMemo(() => {
		const date = new Date(year, month - 1, 1);
		const name = date.toLocaleDateString("pl-PL", { month: "long" });
		return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
	}, [year, month]);

	const firstDayOfWeek = useMemo(() => {
		const d = new Date(year, month - 1, 1);
		const day = d.getDay();
		return day === 0 ? 6 : day - 1;
	}, [year, month]);

	const goToPrevMonth = useCallback(() => {
		const prev = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
		router.replace(`/dashboard/monthly?month=${prev}`);
	}, [year, month, router]);

	const goToNextMonth = useCallback(() => {
		const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
		router.replace(`/dashboard/monthly?month=${next}`);
	}, [year, month, router]);

	const navigateToDay = useCallback(
		(date: string) => {
			const today = toDateString(new Date());
			router.push(date === today ? "/dashboard" : `/dashboard?date=${date}`);
		},
		[router],
	);

	return {
		year,
		month,
		isCurrentMonth,
		monthLabel,
		firstDayOfWeek,
		goToPrevMonth,
		goToNextMonth,
		navigateToDay,
	};
}
