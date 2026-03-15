import type { DosageUnit } from "@/shared/db/schema";
import type { ScheduleEntry, StockStatus } from "../api/queries/get-daily-status";
import { getCycleStatus } from "./cycling";
import { getDependencyStatus } from "./dependency";

type ScheduleRow = {
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
	currentStock: string | null;
	stockUnit: DosageUnit;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	protocolSupplementId: string;
	protocolStartDate: string | null;
	protocolId: string;
	blockId: string;
};

type Log = { id: string; takenAt: Date };

type Context = {
	logMap: Map<string, Log>;
	dailyDosageMap: Map<string, number>;
	date: string;
};

export function buildScheduleEntry(
	row: ScheduleRow,
	ctx: Context,
): { entry: ScheduleEntry; hasLog: boolean } {
	const log = ctx.logMap.get(row.scheduleId);

	const cycleStatus = getCycleStatus(
		row.protocolStartDate,
		row.cycleDaysOn,
		row.cycleDaysOff,
		ctx.date,
		row.startDayOffset,
	);

	const depStatus = getDependencyStatus(
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
		ctx.dailyDosageMap.get(row.supplementId) ?? 0,
	);

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
			dependency: depStatus.isDependent
				? {
						isUnlocked: depStatus.isUnlocked,
						daysRemaining: depStatus.daysRemaining,
					}
				: null,
			isExpired: depStatus.isExpired,
			notStartedDays,
		},
		hasLog: !!log,
	};
}

function buildStockStatus(
	currentStock: string | null,
	stockUnit: DosageUnit,
	totalDaily: number,
): StockStatus | null {
	if (currentStock === null) return null;

	const stock = parseFloat(currentStock);
	return {
		currentStock: stock,
		daysRemaining: totalDaily > 0 ? stock / totalDaily : Number.POSITIVE_INFINITY,
		stockUnit,
	};
}
