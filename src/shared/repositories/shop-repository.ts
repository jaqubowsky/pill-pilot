import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { shops, supplements } from "@/shared/db/schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";

type Shop = typeof shops.$inferSelect;
type NewShop = typeof shops.$inferInsert;

interface IShopRepository {
	findByUserId(userId: string): Promise<Shop[]>;
	findById(id: string): Promise<Shop | undefined>;
	findByIdAndUserId(id: string, userId: string): Promise<Shop>;
	create(data: NewShop): Promise<Shop>;
	update(id: string, data: Partial<NewShop>): Promise<Shop>;
	delete(id: string): Promise<void>;
}

class ShopRepository implements IShopRepository {
	async findByUserId(userId: string): Promise<Shop[]> {
		return db.select().from(shops).where(eq(shops.userId, userId));
	}

	async findById(id: string): Promise<Shop | undefined> {
		const rows = await db.select().from(shops).where(eq(shops.id, id));
		return rows[0];
	}

	async findByIdAndUserId(id: string, userId: string): Promise<Shop> {
		const rows = await db
			.select()
			.from(shops)
			.where(and(eq(shops.id, id), eq(shops.userId, userId)));
		const shop = rows[0];
		if (!shop) {
			throw new ActionError(ActionErrorCode.SHOP_NOT_FOUND);
		}
		return shop;
	}

	async create(data: NewShop): Promise<Shop> {
		const rows = await db.insert(shops).values(data).returning();
		return rows[0];
	}

	async update(id: string, data: Partial<NewShop>): Promise<Shop> {
		const rows = await db.update(shops).set(data).where(eq(shops.id, id)).returning();
		return rows[0];
	}

	async delete(id: string): Promise<void> {
		await db.update(supplements).set({ shopId: null }).where(eq(supplements.shopId, id));
		await db.delete(shops).where(eq(shops.id, id));
	}
}

export const shopRepository: IShopRepository = new ShopRepository();
