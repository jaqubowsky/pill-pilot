import { createLoader, parseAsString } from "nuqs/server";

export const dashboardSearchParams = {
	date: parseAsString.withDefault(""),
};

export const weeklySearchParams = {
	start: parseAsString.withDefault(""),
};

export const monthlySearchParams = {
	month: parseAsString.withDefault(""),
};

export const loadDashboardSearchParams = createLoader(dashboardSearchParams);
export const loadWeeklySearchParams = createLoader(weeklySearchParams);
export const loadMonthlySearchParams = createLoader(monthlySearchParams);
