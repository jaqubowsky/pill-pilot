import { and, asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { timeBlocks } from "@/shared/db/schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";

type TimeBlock = typeof timeBlocks.$inferSelect;
type NewTimeBlock = typeof timeBlocks.$inferInsert;

interface ITimeBlockRepository {
	findByUserId(userId: string): Promise<TimeBlock[]>;
	findById(id: string): Promise<TimeBlock | undefined>;
	findByIdAndUserId(id: string, userId: string): Promise<TimeBlock>;
	create(data: NewTimeBlock): Promise<TimeBlock>;
	update(id: string, data: Partial<NewTimeBlock>): Promise<TimeBlock>;
	softDelete(id: string): Promise<void>;
	reorder(updates: { id: string; sortOrder: number }[]): Promise<void>;
}

class TimeBlockRepository implements ITimeBlockRepository {
	async findByUserId(userId: string): Promise<TimeBlock[]> {
		return db
			.select()
			.from(timeBlocks)
			.where(and(eq(timeBlocks.userId, userId), eq(timeBlocks.active, true)))
			.orderBy(asc(timeBlocks.sortOrder));
	}

	async findById(id: string): Promise<TimeBlock | undefined> {
		const rows = await db.select().from(timeBlocks).where(eq(timeBlocks.id, id));
		return rows[0];
	}

	async findByIdAndUserId(id: string, userId: string): Promise<TimeBlock> {
		const rows = await db
			.select()
			.from(timeBlocks)
			.where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)));
		const block = rows[0];
		if (!block) {
			throw new ActionError(ActionErrorCode.TIME_BLOCK_NOT_FOUND);
		}
		return block;
	}

	async create(data: NewTimeBlock): Promise<TimeBlock> {
		const rows = await db.insert(timeBlocks).values(data).returning();
		return rows[0];
	}

	async update(id: string, data: Partial<NewTimeBlock>): Promise<TimeBlock> {
		const rows = await db.update(timeBlocks).set(data).where(eq(timeBlocks.id, id)).returning();
		return rows[0];
	}

	async softDelete(id: string): Promise<void> {
		await db.update(timeBlocks).set({ active: false }).where(eq(timeBlocks.id, id));
	}

	async reorder(updates: { id: string; sortOrder: number }[]): Promise<void> {
		await Promise.all(
			updates.map(({ id, sortOrder }) =>
				db.update(timeBlocks).set({ sortOrder }).where(eq(timeBlocks.id, id)),
			),
		);
	}
}

export const timeBlockRepository: ITimeBlockRepository = new TimeBlockRepository();
