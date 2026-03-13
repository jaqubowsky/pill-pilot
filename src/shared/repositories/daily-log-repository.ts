import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { dailyLogs } from "@/shared/db/schema";

type DailyLog = typeof dailyLogs.$inferSelect;
type NewDailyLog = typeof dailyLogs.$inferInsert;

interface IDailyLogRepository {
	findByScheduleAndDate(scheduleId: string, date: string): Promise<DailyLog | undefined>;
	findByDateAndScheduleIds(date: string, scheduleIds: string[]): Promise<DailyLog[]>;
	create(data: NewDailyLog): Promise<DailyLog>;
	deleteByScheduleAndDate(scheduleId: string, date: string): Promise<void>;
}

class DailyLogRepository implements IDailyLogRepository {
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

	async deleteByScheduleAndDate(scheduleId: string, date: string): Promise<void> {
		await db
			.delete(dailyLogs)
			.where(and(eq(dailyLogs.scheduleId, scheduleId), eq(dailyLogs.date, date)));
	}
}

export const dailyLogRepository: IDailyLogRepository = new DailyLogRepository();
