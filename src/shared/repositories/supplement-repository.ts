import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { supplements } from "@/shared/db/schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";

type Supplement = typeof supplements.$inferSelect;
type NewSupplement = typeof supplements.$inferInsert;

interface ISupplementRepository {
	findByUserId(userId: string): Promise<Supplement[]>;
	findSummaryByUserId(
		userId: string,
	): Promise<{ id: string; name: string; brandName: string | null }[]>;
	findById(id: string): Promise<Supplement | undefined>;
	findByIdAndUserId(id: string, userId: string): Promise<Supplement>;
	create(data: NewSupplement): Promise<Supplement>;
	update(id: string, data: Partial<NewSupplement>): Promise<Supplement>;
	softDelete(id: string): Promise<void>;
	updateStock(id: string, currentStock: string | null): Promise<Supplement>;
	decrementStock(id: string, amount: string): Promise<void>;
	incrementStock(id: string, amount: string): Promise<void>;
}

class SupplementRepository implements ISupplementRepository {
	async findByUserId(userId: string): Promise<Supplement[]> {
		return db
			.select()
			.from(supplements)
			.where(and(eq(supplements.userId, userId), eq(supplements.active, true)));
	}

	async findSummaryByUserId(
		userId: string,
	): Promise<{ id: string; name: string; brandName: string | null }[]> {
		return db
			.select({ id: supplements.id, name: supplements.name, brandName: supplements.brandName })
			.from(supplements)
			.where(and(eq(supplements.userId, userId), eq(supplements.active, true)));
	}

	async findById(id: string): Promise<Supplement | undefined> {
		const rows = await db.select().from(supplements).where(eq(supplements.id, id));
		return rows[0];
	}

	async findByIdAndUserId(id: string, userId: string): Promise<Supplement> {
		const rows = await db
			.select()
			.from(supplements)
			.where(and(eq(supplements.id, id), eq(supplements.userId, userId)));
		const supplement = rows[0];
		if (!supplement) {
			throw new ActionError(ActionErrorCode.SUPPLEMENT_NOT_FOUND);
		}
		return supplement;
	}

	async create(data: NewSupplement): Promise<Supplement> {
		const rows = await db.insert(supplements).values(data).returning();
		return rows[0];
	}

	async update(id: string, data: Partial<NewSupplement>): Promise<Supplement> {
		const rows = await db.update(supplements).set(data).where(eq(supplements.id, id)).returning();
		return rows[0];
	}

	async softDelete(id: string): Promise<void> {
		await db.update(supplements).set({ active: false }).where(eq(supplements.id, id));
	}

	async updateStock(id: string, currentStock: string | null): Promise<Supplement> {
		const rows = await db
			.update(supplements)
			.set({ currentStock })
			.where(eq(supplements.id, id))
			.returning();
		return rows[0];
	}

	async decrementStock(id: string, amount: string): Promise<void> {
		await db
			.update(supplements)
			.set({
				currentStock: sql`GREATEST(0, ${supplements.currentStock} - ${Number(amount)})`,
			})
			.where(and(eq(supplements.id, id), isNotNull(supplements.currentStock)));
	}

	async incrementStock(id: string, amount: string): Promise<void> {
		await db
			.update(supplements)
			.set({
				currentStock: sql`${supplements.currentStock} + ${Number(amount)}`,
			})
			.where(and(eq(supplements.id, id), isNotNull(supplements.currentStock)));
	}
}

export const supplementRepository: ISupplementRepository = new SupplementRepository();
