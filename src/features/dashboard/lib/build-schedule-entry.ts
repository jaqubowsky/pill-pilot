import type { DosageUnit, SupplementCategory, supplementSchedules } from "@/shared/db/schema";
import type {
	CooldownTimer,
	ScheduleEntry,
	SiblingTakenAt,
	StockStatus,
	WaitTimer,
} from "../api/queries/get-daily-status";
import { getCycleStatus } from "./cycling";
import { getPhaseStatus } from "./phase-status";

type ScheduleRow = Pick<
	typeof supplementSchedules.$inferSelect,
	| "dosageAmount"
	| "dosageUnit"
	| "notes"
	| "sortOrder"
	| "isCritical"
	| "cycleDaysOn"
	| "cycleDaysOff"
	| "startDayOffset"
	| "durationDays"
	| "dosageIntervalMinutes"
	| "waitAfterTakingMinutes"
> & {
	scheduleId: string;
	supplementId: string;
	supplementName: string;
	supplementBrandName: string | null;
	supplementCategory: SupplementCategory;
	currentStock: string | null;
	stockUnit: DosageUnit;
	packageSize: number | null;
	finishPackage: boolean;
	protocolStartDate: string | null;
	protocolId: string;
	blockId: string;
};

type Log = {
	id: string;
	takenAt: Date;
	timerAdjustmentMinutes: number | null;
	timerNotifiedAt: Date | null;
};

type Context = {
	logMap: Map<string, Log>;
	stockForecastMap: Map<string, number>;
	date: string;
	siblingTakenAtMap: Map<string, SiblingTakenAt>;
	totalDailyDosageMap?: Map<string, number>;
};

export type ScheduleEntryResult = {
	entry: ScheduleEntry;
	hasLog: boolean;
};

export function buildScheduleEntry(row: ScheduleRow, ctx: Context): ScheduleEntryResult {
	const log = ctx.logMap.get(row.scheduleId);

	const cycleStatus = getCycleStatus(
		row.protocolStartDate,
		row.cycleDaysOn,
		row.cycleDaysOff,
		ctx.date,
		row.startDayOffset,
	);

	const depStatus = getPhaseStatus(
		row.startDayOffset,
		row.durationDays,
		row.protocolStartDate,
		ctx.date,
	);

	let notStartedDays: number | null = null;
	if (row.protocolStartDate) {
		const startMs = new Date(row.protocolStartDate).getTime();
		const currentMs = new Date(ctx.date).getTime();
		if (currentMs < startMs) {
			notStartedDays = Math.ceil((startMs - currentMs) / (1000 * 60 * 60 * 24));
		}
	}

	const stockStatus = buildStockStatus(
		row.currentStock,
		row.stockUnit,
		ctx.stockForecastMap.get(row.supplementId) ?? Number.POSITIVE_INFINITY,
	);

	const cooldown = computeCooldown(row, log, ctx);
	const waitTimer = computeWaitTimer(row, log);

	return {
		entry: {
			scheduleId: row.scheduleId,
			dosageAmount: row.dosageAmount,
			dosageUnit: row.dosageUnit,
			notes: row.notes,
			sortOrder: row.sortOrder,
			supplementId: row.supplementId,
			supplementName: row.supplementName,
			supplementBrandName: row.supplementBrandName,
			supplementCategory: row.supplementCategory,
			isCritical: row.isCritical,
			cycleDaysOn: row.cycleDaysOn,
			cycleDaysOff: row.cycleDaysOff,
			startDayOffset: row.startDayOffset,
			durationDays: row.durationDays,
			timeBlockId: row.blockId,
			stockStatus,
			logId: log?.id ?? null,
			takenAt: log?.takenAt ?? null,
			protocolId: row.protocolId,
			cycling: cycleStatus.isCycling
				? { isOnPhase: cycleStatus.isOnPhase, daysRemaining: cycleStatus.daysRemaining }
				: null,
			phase: depStatus.isPhased
				? {
						isUnlocked: depStatus.isUnlocked,
						daysRemaining: depStatus.daysRemaining,
					}
				: null,
			isExpired: depStatus.isExpired,
			notStartedDays,
			dosageIntervalMinutes: row.dosageIntervalMinutes,
			waitAfterTakingMinutes: row.waitAfterTakingMinutes,
			cooldown,
			waitTimer,
			packageSize: row.packageSize,
			finishPackage: row.finishPackage,
			totalDailyDosage:
				ctx.totalDailyDosageMap?.get(row.supplementId) ?? parseFloat(row.dosageAmount),
		},
		hasLog: !!log,
	};
}

function computeCooldown(
	row: ScheduleRow,
	log: Log | undefined,
	ctx: Context,
): CooldownTimer | null {
	if (!row.dosageIntervalMinutes || log) return null;

	const key = `${row.protocolId}:${row.supplementId}`;
	const sibling = ctx.siblingTakenAtMap.get(key);
	if (!sibling || sibling.cooldownSkipped) return null;

	const intervalMs = row.dosageIntervalMinutes * 60 * 1000;
	const adjustmentMs = sibling.adjustmentMinutes * 60 * 1000;
	const expiresAt = sibling.takenAt.getTime() + intervalMs + adjustmentMs;
	const remainingMs = expiresAt - Date.now();

	if (remainingMs <= 0) return null;
	return { remainingMs, logId: sibling.logId };
}

function computeWaitTimer(row: ScheduleRow, log: Log | undefined): WaitTimer | null {
	if (!row.waitAfterTakingMinutes || !log) return null;
	if (log.timerNotifiedAt) return null;

	const waitMs = row.waitAfterTakingMinutes * 60 * 1000;
	const adjustmentMs = (log.timerAdjustmentMinutes ?? 0) * 60 * 1000;
	const expiresAt = log.takenAt.getTime() + waitMs + adjustmentMs;
	const remainingMs = expiresAt - Date.now();

	if (remainingMs <= 0) return null;
	return { remainingMs };
}

function buildStockStatus(
	currentStock: string | null,
	stockUnit: DosageUnit,
	daysInStock: number,
): StockStatus | null {
	if (currentStock === null) return null;

	return {
		currentStock: parseFloat(currentStock),
		daysRemaining: daysInStock,
		stockUnit,
	};
}
