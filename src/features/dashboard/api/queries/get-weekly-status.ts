import { groupLogsByDate, isScheduleActionable } from "@/features/dashboard/lib/schedule-filters";
import { db } from "@/shared/db/client";
import { protocols, supplementSchedules, supplements, timeBlocks } from "@/shared/db/schema";
import {
	activeScheduleJoins,
	activeScheduleWhere,
	fetchLogsByDateRange,
} from "./active-schedules-query";

export type WeeklyDayTimeBlock = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	totalSchedules: number;
	completedCount: number;
};

export type WeeklyDay = {
	date: string;
	totalSchedules: number;
	completedCount: number;
	timeBlocks: WeeklyDayTimeBlock[];
};

export type WeeklyStatus = {
	days: WeeklyDay[];
};

function buildDateRange(startDate: string, count: number): string[] {
	const start = new Date(startDate);
	const dates: string[] = [];
	for (let i = 0; i < count; i++) {
		const d = new Date(start);
		d.setDate(d.getDate() + i);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		dates.push(`${y}-${m}-${day}`);
	}
	return dates;
}

export async function getWeeklyStatus(userId: string, startDate: string): Promise<WeeklyStatus> {
	const dates = buildDateRange(startDate, 7);
	const endDate = dates[6];

	const activeSchedules = await db
		.select({
			scheduleId: supplementSchedules.id,
			blockId: timeBlocks.id,
			blockName: timeBlocks.name,
			blockIcon: timeBlocks.icon,
			startTime: timeBlocks.startTime,
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
				timeBlocks: [],
			})),
		};
	}

	const scheduleIds = activeSchedules.map((s) => s.scheduleId);
	const logs = await fetchLogsByDateRange(scheduleIds, startDate, endDate);
	const logsByDate = groupLogsByDate(logs);

	const blockMap = new Map<string, { blockName: string; blockIcon: string; startTime: string }>();
	for (const schedule of activeSchedules) {
		if (!blockMap.has(schedule.blockId)) {
			blockMap.set(schedule.blockId, {
				blockName: schedule.blockName,
				blockIcon: schedule.blockIcon,
				startTime: schedule.startTime,
			});
		}
	}

	const days: WeeklyDay[] = dates.map((date) => {
		const completedSet = logsByDate.get(date) ?? new Set<string>();
		const actionable = activeSchedules.filter((s) => isScheduleActionable(s, date));

		const blockSchedules = new Map<string, { total: number; completed: number }>();
		for (const s of actionable) {
			const entry = blockSchedules.get(s.blockId) ?? { total: 0, completed: 0 };
			entry.total++;
			if (completedSet.has(s.scheduleId)) entry.completed++;
			blockSchedules.set(s.blockId, entry);
		}

		const dayTimeBlocks: WeeklyDayTimeBlock[] = [];
		for (const [blockId, info] of blockMap) {
			const counts = blockSchedules.get(blockId);
			if (!counts) continue;
			dayTimeBlocks.push({
				blockId,
				blockName: info.blockName,
				blockIcon: info.blockIcon,
				startTime: info.startTime,
				totalSchedules: counts.total,
				completedCount: counts.completed,
			});
		}

		dayTimeBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

		const totalSchedules = actionable.length;
		const completedCount = actionable.filter((s) => completedSet.has(s.scheduleId)).length;

		return { date, totalSchedules, completedCount, timeBlocks: dayTimeBlocks };
	});

	return { days };
}
