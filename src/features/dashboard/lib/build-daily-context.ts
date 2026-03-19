import type { ScheduleConsumption } from "@/shared/lib/stock-forecast";
import { forecastDaysInStock } from "@/shared/lib/stock-forecast";
import type { ScheduleEntry, SiblingTakenAt } from "../api/queries/get-daily-status";
import type { BlockInfo } from "./group-by-time-block";

type ScheduleRow = {
	scheduleId: string;
	supplementId: string;
	protocolId: string;
	dosageAmount: string;
	currentStock: string | null;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	protocolStartDate: string | null;
	dosageIntervalMinutes: number | null;
};

type LogRow = {
	id: string;
	scheduleId: string;
	takenAt: Date;
	timerAdjustmentMinutes: number | null;
	cooldownSkippedAt: Date | null;
};

export function buildStockForecastMap(schedules: ScheduleRow[], date: string): Map<string, number> {
	const schedulesPerSupplement = new Map<string, ScheduleConsumption[]>();
	const stockPerSupplement = new Map<string, string | null>();

	for (const row of schedules) {
		const arr = schedulesPerSupplement.get(row.supplementId) ?? [];
		arr.push({
			dosageAmount: parseFloat(row.dosageAmount),
			cycleDaysOn: row.cycleDaysOn,
			cycleDaysOff: row.cycleDaysOff,
			startDayOffset: row.startDayOffset,
			durationDays: row.durationDays,
			protocolStartDate: row.protocolStartDate,
		});
		schedulesPerSupplement.set(row.supplementId, arr);
		if (!stockPerSupplement.has(row.supplementId)) {
			stockPerSupplement.set(row.supplementId, row.currentStock);
		}
	}

	const forecastMap = new Map<string, number>();
	for (const [supplementId, scheds] of schedulesPerSupplement) {
		const stock = stockPerSupplement.get(supplementId);
		if (stock === null || stock === undefined) continue;
		forecastMap.set(supplementId, forecastDaysInStock(parseFloat(stock), scheds, date));
	}

	return forecastMap;
}

export function buildTotalDailyDosageMap(schedules: ScheduleRow[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const row of schedules) {
		map.set(row.supplementId, (map.get(row.supplementId) ?? 0) + parseFloat(row.dosageAmount));
	}
	return map;
}

export function buildSiblingTakenAtMap(
	schedules: ScheduleRow[],
	logMap: Map<string, LogRow>,
): Map<string, SiblingTakenAt> {
	const map = new Map<string, SiblingTakenAt>();

	for (const row of schedules) {
		if (!row.dosageIntervalMinutes) continue;

		const log = logMap.get(row.scheduleId);
		if (!log) continue;

		const key = `${row.protocolId}:${row.supplementId}`;
		const existing = map.get(key);

		if (!existing || log.takenAt > existing.takenAt) {
			map.set(key, {
				logId: log.id,
				takenAt: log.takenAt,
				adjustmentMinutes: log.timerAdjustmentMinutes ?? 0,
				cooldownSkipped: log.cooldownSkippedAt !== null,
			});
		}
	}

	return map;
}

type GroupedEntry = { block: BlockInfo; entry: ScheduleEntry; hasLog: boolean };

export function filterVisibleEntries(entries: GroupedEntry[]): GroupedEntry[] {
	return entries.filter((row) => row.entry.notStartedDays === null || row.hasLog);
}

export function countActionable(entries: GroupedEntry[]): {
	totalSchedules: number;
	completedCount: number;
} {
	const actionable = entries.filter((row) => {
		const e = row.entry;
		if (e.isExpired) return false;
		if (e.phase && !e.phase.isUnlocked) return false;
		if (e.cycling && !e.cycling.isOnPhase) return false;
		return true;
	});

	return {
		totalSchedules: actionable.length,
		completedCount: actionable.filter((row) => row.hasLog).length,
	};
}
