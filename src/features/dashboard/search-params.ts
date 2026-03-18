import { createLoader, parseAsString } from "nuqs/server";
import { getMondayOfWeek, toDateString, toYearMonth } from "@/shared/lib/date";

export const dashboardSearchParams = {
	date: parseAsString.withDefault(toDateString(new Date())),
};

export const weeklySearchParams = {
	start: parseAsString.withDefault(toDateString(getMondayOfWeek(new Date()))),
};

export const monthlySearchParams = {
	month: parseAsString.withDefault(toYearMonth(new Date())),
};

export const loadDashboardSearchParams = createLoader(dashboardSearchParams);
export const loadWeeklySearchParams = createLoader(weeklySearchParams);
export const loadMonthlySearchParams = createLoader(monthlySearchParams);
