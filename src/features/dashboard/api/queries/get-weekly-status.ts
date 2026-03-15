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
		const dateKey = log.date;
		if (!logsByDate.has(dateKey)) {
			logsByDate.set(dateKey, new Set());
		}
		logsByDate.get(dateKey)!.add(log.scheduleId);
	}

	const blockMap = new Map<string, { blockName: string; blockIcon: string; startTime: string }>();
	const schedulesByBlock = new Map<string, string[]>();

	for (const schedule of activeSchedules) {
		if (!blockMap.has(schedule.blockId)) {
			blockMap.set(schedule.blockId, {
				blockName: schedule.blockName,
				blockIcon: schedule.blockIcon,
				startTime: schedule.startTime,
			});
		}
		if (!schedulesByBlock.has(schedule.blockId)) {
			schedulesByBlock.set(schedule.blockId, []);
		}
		schedulesByBlock.get(schedule.blockId)!.push(schedule.scheduleId);
	}

	const days: WeeklyDay[] = dates.map((date) => {
		const completedSet = logsByDate.get(date) ?? new Set<string>();

		const dayTimeBlocks: WeeklyDayTimeBlock[] = [];
		for (const [blockId, info] of blockMap) {
			const blockSchedules = schedulesByBlock.get(blockId) ?? [];
			const blockCompleted = blockSchedules.filter((id) => completedSet.has(id)).length;
			dayTimeBlocks.push({
				blockId,
				blockName: info.blockName,
				blockIcon: info.blockIcon,
				startTime: info.startTime,
				totalSchedules: blockSchedules.length,
				completedCount: blockCompleted,
			});
		}

		dayTimeBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

		return {
			date,
			totalSchedules: activeSchedules.length,
			completedCount: completedSet.size,
			timeBlocks: dayTimeBlocks,
		};
	});

	return { days };
}
