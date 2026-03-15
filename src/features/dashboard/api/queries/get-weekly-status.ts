import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	ProtocolStatus,
	protocolSupplements,
	protocols,
	supplementSchedules,
	supplements,
	timeBlocks,
} from "@/shared/db/schema";
import { getCycleStatus } from "@/features/dashboard/lib/cycling";
import { getDependencyStatus } from "@/features/dashboard/lib/dependency";

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

export async function getWeeklyStatus(userId: string, startDate: string): Promise<WeeklyStatus> {
	const start = new Date(startDate);
	const dates: string[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(start);
		d.setDate(d.getDate() + i);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		dates.push(`${y}-${m}-${day}`);
	}

	const endDate = dates[6];

	const activeSchedules = await db
		.select({
			scheduleId: supplementSchedules.id,
			blockId: timeBlocks.id,
			blockName: timeBlocks.name,
			blockIcon: timeBlocks.icon,
			startTime: timeBlocks.startTime,
			cycleDaysOn: protocolSupplements.cycleDaysOn,
			cycleDaysOff: protocolSupplements.cycleDaysOff,
			startDayOffset: protocolSupplements.startDayOffset,
			durationDays: protocolSupplements.durationDays,
			protocolStartDate: protocols.startDate,
		})
		.from(supplementSchedules)
		.innerJoin(
			protocolSupplements,
			eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
		)
		.innerJoin(supplements, eq(protocolSupplements.supplementId, supplements.id))
		.innerJoin(protocols, eq(protocolSupplements.protocolId, protocols.id))
		.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
		.where(
			and(
				eq(protocols.userId, userId),
				eq(protocols.status, ProtocolStatus.active),
				eq(protocolSupplements.active, true),
				eq(supplements.active, true),
				eq(timeBlocks.active, true),
			),
		);

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
	const logs = await db
		.select({
			scheduleId: dailyLogs.scheduleId,
			date: dailyLogs.date,
		})
		.from(dailyLogs)
		.where(
			and(
				inArray(dailyLogs.scheduleId, scheduleIds),
				gte(dailyLogs.date, startDate),
				lte(dailyLogs.date, endDate),
			),
		);

	const logsByDate = new Map<string, Set<string>>();
	for (const log of logs) {
		if (!logsByDate.has(log.date)) {
			logsByDate.set(log.date, new Set());
		}
		logsByDate.get(log.date)!.add(log.scheduleId);
	}

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

		const actionable = activeSchedules.filter((s) => isActionable(s, date));

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

		return {
			date,
			totalSchedules,
			completedCount,
			timeBlocks: dayTimeBlocks,
		};
	});

	return { days };
}

function isActionable(
	schedule: {
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		startDayOffset: number;
		durationDays: number | null;
		protocolStartDate: string | null;
	},
	date: string,
): boolean {
	const dep = getDependencyStatus(
		schedule.startDayOffset,
		schedule.durationDays,
		schedule.protocolStartDate,
		date,
	);
	if (dep.isExpired) return false;
	if (dep.isDependent && !dep.isUnlocked) return false;

	const cycle = getCycleStatus(
		schedule.protocolStartDate,
		schedule.cycleDaysOn,
		schedule.cycleDaysOff,
		date,
		schedule.startDayOffset,
	);
	if (cycle.isCycling && !cycle.isOnPhase) return false;

	return true;
}
