import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { getCycleStatus } from "@/features/dashboard/lib/cycling";
import { getPhaseStatus } from "@/features/dashboard/lib/phase-status";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	ProtocolStatus,
	protocols,
	supplementSchedules,
	supplements,
	timeBlocks,
} from "@/shared/db/schema";

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

	const days: MonthlyDay[] = dates.map((date) => {
		const completedSet = logsByDate.get(date) ?? new Set<string>();

		const actionable = activeSchedules.filter((s) => isActionable(s, date));
		const totalSchedules = actionable.length;
		const completedCount = actionable.filter((s) => completedSet.has(s.scheduleId)).length;
		const completionPercent =
			totalSchedules > 0 ? Math.round((completedCount / totalSchedules) * 100) : 0;

		return {
			date,
			totalSchedules,
			completedCount,
			completionPercent,
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
	const dep = getPhaseStatus(
		schedule.startDayOffset,
		schedule.durationDays,
		schedule.protocolStartDate,
		date,
	);
	if (dep.isExpired) return false;
	if (dep.isPhased && !dep.isUnlocked) return false;

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
