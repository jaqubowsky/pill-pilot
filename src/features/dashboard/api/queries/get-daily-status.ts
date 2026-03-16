import { and, eq, inArray } from "drizzle-orm";
import { buildScheduleEntry } from "@/features/dashboard/lib/build-schedule-entry";
import { groupByTimeBlock } from "@/features/dashboard/lib/group-by-time-block";
import { assignProtocolColors } from "@/features/dashboard/lib/protocol-colors";
import { db } from "@/shared/db/client";
import {
	type DosageUnit,
	dailyLogs,
	ProtocolStatus,
	protocols,
	supplementSchedules,
	supplements,
	timeBlocks,
} from "@/shared/db/schema";

export type StockStatus = {
	currentStock: number;
	daysRemaining: number;
	stockUnit: DosageUnit;
};

export type ScheduleEntry = {
	scheduleId: string;
	dosageAmount: string;
	dosageUnit: DosageUnit;
	notes: string | null;
	sortOrder: number;
	supplementId: string;
	supplementName: string;
	supplementBrandName: string | null;
	supplementCategory: string;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	timeBlockId: string;
	stockStatus: StockStatus | null;
	logId: string | null;
	takenAt: Date | null;
	cycling: { isOnPhase: boolean; daysRemaining: number } | null;
	dependency: { isUnlocked: boolean; daysRemaining: number } | null;
	isExpired: boolean;
	notStartedDays: number | null;
	protocolId: string;
	dosageIntervalMinutes: number | null;
	waitAfterTakingMinutes: number | null;
	cooldown: { remainingMs: number; logId: string } | null;
	waitTimer: { remainingMs: number } | null;
};

export type TimeBlockStatus = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	sortOrder: string;
	entries: ScheduleEntry[];
	completedCount: number;
	actionableCount: number;
};

export type DailyStatus = {
	timeBlocks: TimeBlockStatus[];
	totalSchedules: number;
	completedCount: number;
	protocolColors: Record<string, number>;
};

export async function getDailyStatus(userId: string, date: string): Promise<DailyStatus> {
	const activeSchedules = await db
		.select({
			scheduleId: supplementSchedules.id,
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			notes: supplementSchedules.notes,
			sortOrder: supplementSchedules.sortOrder,
			supplementId: supplements.id,
			supplementName: supplements.name,
			supplementBrandName: supplements.brandName,
			supplementCategory: supplements.category,
			isCritical: supplementSchedules.isCritical,
			currentStock: supplements.currentStock,
			stockUnit: supplements.stockUnit,
			blockId: timeBlocks.id,
			blockName: timeBlocks.name,
			blockIcon: timeBlocks.icon,
			startTime: timeBlocks.startTime,
			blockSortOrder: timeBlocks.startTime,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			protocolStartDate: protocols.startDate,
			protocolId: protocols.id,
			dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes,
			waitAfterTakingMinutes: supplementSchedules.waitAfterTakingMinutes,
		})
		.from(supplementSchedules)
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
		.where(
			and(
				eq(protocols.userId, userId),
				eq(protocols.status, ProtocolStatus.active),
				eq(supplementSchedules.active, true),
				eq(supplements.active, true),
				eq(timeBlocks.active, true),
			),
		);

	if (activeSchedules.length === 0) {
		return { timeBlocks: [], totalSchedules: 0, completedCount: 0, protocolColors: {} };
	}

	const scheduleIds = activeSchedules.map((s) => s.scheduleId);
	const logs = await db
		.select()
		.from(dailyLogs)
		.where(and(eq(dailyLogs.date, date), inArray(dailyLogs.scheduleId, scheduleIds)));

	const logMap = new Map(logs.map((l) => [l.scheduleId, l]));

	const dailyDosageMap = new Map<string, number>();
	for (const row of activeSchedules) {
		dailyDosageMap.set(
			row.supplementId,
			(dailyDosageMap.get(row.supplementId) ?? 0) + parseFloat(row.dosageAmount),
		);
	}

	const siblingTakenAtMap = new Map<
		string,
		{ logId: string; takenAt: Date; adjustmentMinutes: number; cooldownSkipped: boolean }
	>();
	for (const row of activeSchedules) {
		if (!row.dosageIntervalMinutes) continue;
		const log = logMap.get(row.scheduleId);
		if (!log) continue;
		const key = `${row.protocolId}:${row.supplementId}`;
		const existing = siblingTakenAtMap.get(key);
		if (!existing || log.takenAt > existing.takenAt) {
			siblingTakenAtMap.set(key, {
				logId: log.id,
				takenAt: log.takenAt,
				adjustmentMinutes: log.timerAdjustmentMinutes ?? 0,
				cooldownSkipped: log.cooldownSkippedAt !== null,
			});
		}
	}

	const ctx = { logMap, dailyDosageMap, date, siblingTakenAtMap };

	const grouped = activeSchedules
		.map((row) => ({
			block: {
				blockId: row.blockId,
				blockName: row.blockName,
				blockIcon: row.blockIcon,
				startTime: row.startTime,
				blockSortOrder: row.blockSortOrder,
			},
			...buildScheduleEntry(row, ctx),
		}))
		.filter((row) => row.entry.notStartedDays === null || row.hasLog);

	const sortedBlocks = groupByTimeBlock(grouped);
	const protocolColors = assignProtocolColors(activeSchedules.map((s) => s.protocolId));

	const actionable = grouped.filter((row) => {
		const e = row.entry;
		if (e.isExpired) return false;
		if (e.dependency && !e.dependency.isUnlocked) return false;
		if (e.cycling && !e.cycling.isOnPhase) return false;
		return true;
	});
	const visibleCount = actionable.length;
	const visibleCompleted = actionable.filter((row) => row.hasLog).length;

	return {
		timeBlocks: sortedBlocks,
		totalSchedules: visibleCount,
		completedCount: visibleCompleted,
		protocolColors,
	};
}
