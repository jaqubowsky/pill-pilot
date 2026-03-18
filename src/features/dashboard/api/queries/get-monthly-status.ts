import { groupLogsByDate, isScheduleActionable } from "@/features/dashboard/lib/schedule-filters";
import { db } from "@/shared/db/client";
import { protocols, supplementSchedules, supplements, timeBlocks } from "@/shared/db/schema";
import {
	activeScheduleJoins,
	activeScheduleWhere,
	fetchLogsByDateRange,
} from "./active-schedules-query";

export type MonthlyDay = {
	date: string;
	totalSchedules: number;
	completedCount: number;
	completionPercent: number;
};

export type MonthlyStatus = {
	days: MonthlyDay[];
};

export async function getMonthlyStatus(userId: string, yearMonth: string): Promise<MonthlyStatus> {
	const [year, month] = yearMonth.split("-").map(Number);
	const daysInMonth = new Date(year, month, 0).getDate();

	const dates: string[] = [];
	for (let d = 1; d <= daysInMonth; d++) {
		const m = String(month).padStart(2, "0");
		const day = String(d).padStart(2, "0");
		dates.push(`${year}-${m}-${day}`);
	}

	const startDate = dates[0];
	const endDate = dates[dates.length - 1];

	const activeSchedules = await db
		.select({
			scheduleId: supplementSchedules.id,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			protocolStartDate: protocols.startDate,
		})
		.from(supplementSchedules)
		.innerJoin(supplements, activeScheduleJoins.supplements())
		.innerJoin(protocols, activeScheduleJoins.protocols())
		.innerJoin(timeBlocks, activeScheduleJoins.timeBlocks())
		.where(activeScheduleWhere(userId));

	if (activeSchedules.length === 0) {
		return {
			days: dates.map((date) => ({
				date,
				totalSchedules: 0,
				completedCount: 0,
				completionPercent: 0,
			})),
		};
	}

	const scheduleIds = activeSchedules.map((s) => s.scheduleId);
	const logs = await fetchLogsByDateRange(scheduleIds, startDate, endDate);
	const logsByDate = groupLogsByDate(logs);

	const days: MonthlyDay[] = dates.map((date) => {
		const completedSet = logsByDate.get(date) ?? new Set<string>();
		const actionable = activeSchedules.filter((s) => isScheduleActionable(s, date));
		const totalSchedules = actionable.length;
		const completedCount = actionable.filter((s) => completedSet.has(s.scheduleId)).length;
		const completionPercent =
			totalSchedules > 0 ? Math.round((completedCount / totalSchedules) * 100) : 0;

		return { date, totalSchedules, completedCount, completionPercent };
	});

	return { days };
}
