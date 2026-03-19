import { and, eq, inArray } from "drizzle-orm";
import {
	buildSiblingTakenAtMap,
	buildStockForecastMap,
	buildTotalDailyDosageMap,
	countActionable,
	filterVisibleEntries,
} from "@/features/dashboard/lib/build-daily-context";
import { buildScheduleEntry } from "@/features/dashboard/lib/build-schedule-entry";
import { groupByTimeBlock } from "@/features/dashboard/lib/group-by-time-block";
import { db } from "@/shared/db/client";
import {
	type DosageUnit,
	dailyLogs,
	protocols,
	type SupplementCategory,
	supplementSchedules,
	supplements,
	timeBlocks,
} from "@/shared/db/schema";
import { assignProtocolColors } from "@/shared/lib/protocol-colors";
import { activeScheduleJoins, activeScheduleWhere } from "./active-schedules-query";

export type StockStatus = {
	currentStock: number;
	daysRemaining: number;
	stockUnit: DosageUnit;
};

export type CyclingInfo = {
	isOnPhase: boolean;
	daysRemaining: number;
};

export type PhaseInfo = {
	isUnlocked: boolean;
	daysRemaining: number;
};

export type CooldownTimer = {
	remainingMs: number;
	logId: string;
};

export type WaitTimer = {
	remainingMs: number;
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
	supplementCategory: SupplementCategory;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	timeBlockId: string;
	stockStatus: StockStatus | null;
	logId: string | null;
	takenAt: Date | null;
	cycling: CyclingInfo | null;
	phase: PhaseInfo | null;
	isExpired: boolean;
	notStartedDays: number | null;
	protocolId: string;
	dosageIntervalMinutes: number | null;
	waitAfterTakingMinutes: number | null;
	cooldown: CooldownTimer | null;
	waitTimer: WaitTimer | null;
	packageSize: number | null;
	finishPackage: boolean;
	totalDailyDosage: number;
};

export type TimeBlockStatus = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	sortOrder: number;
	entries: ScheduleEntry[];
	completedCount: number;
	actionableCount: number;
};

export type TimeBlockSummary = {
	id: string;
	name: string;
	startTime: string;
};

export type SiblingTakenAt = {
	logId: string;
	takenAt: Date;
	adjustmentMinutes: number;
	cooldownSkipped: boolean;
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
			packageSize: supplements.packageSize,
			finishPackage: supplementSchedules.finishPackage,
			blockId: timeBlocks.id,
			blockName: timeBlocks.name,
			blockIcon: timeBlocks.icon,
			startTime: timeBlocks.startTime,
			blockSortOrder: timeBlocks.sortOrder,
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
		.innerJoin(supplements, activeScheduleJoins.supplements())
		.innerJoin(protocols, activeScheduleJoins.protocols())
		.innerJoin(timeBlocks, activeScheduleJoins.timeBlocks())
		.where(activeScheduleWhere(userId));

	if (activeSchedules.length === 0) {
		return { timeBlocks: [], totalSchedules: 0, completedCount: 0, protocolColors: {} };
	}

	const scheduleIds = activeSchedules.map((s) => s.scheduleId);
	const logs = await db
		.select()
		.from(dailyLogs)
		.where(and(eq(dailyLogs.date, date), inArray(dailyLogs.scheduleId, scheduleIds)));

	const logMap = new Map(logs.map((l) => [l.scheduleId, l]));
	const stockForecastMap = buildStockForecastMap(activeSchedules, date);
	const totalDailyDosageMap = buildTotalDailyDosageMap(activeSchedules);
	const siblingTakenAtMap = buildSiblingTakenAtMap(activeSchedules, logMap);

	const ctx = { logMap, stockForecastMap, date, siblingTakenAtMap, totalDailyDosageMap };

	const allEntries = activeSchedules.map((row) => ({
		block: {
			blockId: row.blockId,
			blockName: row.blockName,
			blockIcon: row.blockIcon,
			startTime: row.startTime,
			blockSortOrder: row.blockSortOrder,
		},
		...buildScheduleEntry(row, ctx),
	}));

	const visible = filterVisibleEntries(allEntries);
	const { totalSchedules, completedCount } = countActionable(visible);

	return {
		timeBlocks: groupByTimeBlock(visible),
		totalSchedules,
		completedCount,
		protocolColors: assignProtocolColors(activeSchedules.map((s) => s.protocolId)),
	};
}
