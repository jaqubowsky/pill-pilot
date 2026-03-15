import { and, eq, inArray } from "drizzle-orm";
import { buildScheduleEntry } from "@/features/dashboard/lib/build-schedule-entry";
import { groupByTimeBlock } from "@/features/dashboard/lib/group-by-time-block";
import { assignProtocolColors } from "@/features/dashboard/lib/protocol-colors";
import { db } from "@/shared/db/client";
import {
	type DosageUnit,
	dailyLogs,
	ProtocolStatus,
	protocolSupplements,
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
	isCritical: boolean;
	stockStatus: StockStatus | null;
	logId: string | null;
	takenAt: Date | null;
	cycling: { isOnPhase: boolean; daysRemaining: number } | null;
	dependency: { isUnlocked: boolean; daysRemaining: number } | null;
	isExpired: boolean;
	notStartedDays: number | null;
	protocolId: string;
};

export type TimeBlockStatus = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	sortOrder: string;
	entries: ScheduleEntry[];
	completedCount: number;
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
			notes: protocolSupplements.notes,
			sortOrder: protocolSupplements.sortOrder,
			supplementId: supplements.id,
			supplementName: supplements.name,
			isCritical: protocolSupplements.isCritical,
			currentStock: supplements.currentStock,
			stockUnit: supplements.stockUnit,
			blockId: timeBlocks.id,
			blockName: timeBlocks.name,
			blockIcon: timeBlocks.icon,
			startTime: timeBlocks.startTime,
			blockSortOrder: timeBlocks.startTime,
			cycleDaysOn: protocolSupplements.cycleDaysOn,
			cycleDaysOff: protocolSupplements.cycleDaysOff,
			startDayOffset: protocolSupplements.startDayOffset,
			durationDays: protocolSupplements.durationDays,
			protocolSupplementId: protocolSupplements.id,
			protocolStartDate: protocols.startDate,
			protocolId: protocols.id,
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

	const ctx = { logMap, dailyDosageMap, date };

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

	const visibleCount = grouped.length;
	const visibleCompleted = grouped.filter((row) => row.hasLog).length;

	return {
		timeBlocks: sortedBlocks,
		totalSchedules: visibleCount,
		completedCount: visibleCompleted,
		protocolColors,
	};
}
