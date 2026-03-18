import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { dailyLogs, protocols, supplementSchedules } from "@/shared/db/schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";

type DailyLog = typeof dailyLogs.$inferSelect;
type NewDailyLog = typeof dailyLogs.$inferInsert;

interface IDailyLogRepository {
	findOwnedById(logId: string, userId: string): Promise<DailyLog>;
	findByScheduleAndDate(scheduleId: string, date: string): Promise<DailyLog | undefined>;
	findByDateAndScheduleIds(date: string, scheduleIds: string[]): Promise<DailyLog[]>;
	create(data: NewDailyLog): Promise<DailyLog>;
	updateById(id: string, data: Partial<NewDailyLog>): Promise<void>;
	deleteByScheduleAndDate(scheduleId: string, date: string): Promise<void>;
}

class DailyLogRepository implements IDailyLogRepository {
	async findOwnedById(logId: string, userId: string): Promise<DailyLog> {
		const rows = await db
			.select({
				id: dailyLogs.id,
				scheduleId: dailyLogs.scheduleId,
				date: dailyLogs.date,
				takenAt: dailyLogs.takenAt,
				timerNotifiedAt: dailyLogs.timerNotifiedAt,
				timerAdjustmentMinutes: dailyLogs.timerAdjustmentMinutes,
				cooldownSkippedAt: dailyLogs.cooldownSkippedAt,
			})
			.from(dailyLogs)
			.innerJoin(supplementSchedules, eq(dailyLogs.scheduleId, supplementSchedules.id))
			.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
			.where(and(eq(dailyLogs.id, logId), eq(protocols.userId, userId)));

		if (!rows[0]) {
			throw new ActionError(ActionErrorCode.SCHEDULE_NOT_FOUND);
		}

		return rows[0];
	}

	async findByScheduleAndDate(scheduleId: string, date: string): Promise<DailyLog | undefined> {
		const rows = await db
			.select()
			.from(dailyLogs)
			.where(and(eq(dailyLogs.scheduleId, scheduleId), eq(dailyLogs.date, date)));
		return rows[0];
	}

	async findByDateAndScheduleIds(date: string, scheduleIds: string[]): Promise<DailyLog[]> {
		if (scheduleIds.length === 0) return [];
		return db
			.select()
			.from(dailyLogs)
			.where(and(eq(dailyLogs.date, date), inArray(dailyLogs.scheduleId, scheduleIds)));
	}

	async create(data: NewDailyLog): Promise<DailyLog> {
		const rows = await db.insert(dailyLogs).values(data).returning();
		return rows[0];
	}

	async updateById(id: string, data: Partial<NewDailyLog>): Promise<void> {
		await db.update(dailyLogs).set(data).where(eq(dailyLogs.id, id));
	}

	async deleteByScheduleAndDate(scheduleId: string, date: string): Promise<void> {
		await db
			.delete(dailyLogs)
			.where(and(eq(dailyLogs.scheduleId, scheduleId), eq(dailyLogs.date, date)));
	}
}

export const dailyLogRepository: IDailyLogRepository = new DailyLogRepository();
