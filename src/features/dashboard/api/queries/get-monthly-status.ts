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

	const totalSchedules = activeSchedules.length;

	if (totalSchedules === 0) {
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

	const logsByDate = new Map<string, number>();
	for (const log of logs) {
		logsByDate.set(log.date, (logsByDate.get(log.date) ?? 0) + 1);
	}

	const days: MonthlyDay[] = dates.map((date) => {
		const completedCount = logsByDate.get(date) ?? 0;
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
