import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	ProtocolStatus,
	protocols,
	supplementSchedules,
	supplements,
	timeBlocks,
} from "@/shared/db/schema";

export const activeScheduleWhere = (userId: string) =>
	and(
		eq(protocols.userId, userId),
		eq(protocols.status, ProtocolStatus.active),
		eq(supplementSchedules.active, true),
		eq(supplements.active, true),
		eq(timeBlocks.active, true),
	);

export const activeScheduleJoins = {
	supplements: () => eq(supplementSchedules.supplementId, supplements.id),
	protocols: () => eq(supplementSchedules.protocolId, protocols.id),
	timeBlocks: () => eq(supplementSchedules.timeBlockId, timeBlocks.id),
};

export async function fetchLogsByDateRange(
	scheduleIds: string[],
	startDate: string,
	endDate: string,
) {
	if (scheduleIds.length === 0) return [];

	return db
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
}
