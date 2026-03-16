import { desc, eq } from "drizzle-orm";
import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";
import { db } from "@/shared/db/client";
import { cartScans } from "@/shared/db/schema";

export type RecentScan = {
	id: string;
	shopName: string | null;
	items: CartItem[];
	createdAt: Date;
};

export async function getRecentScans(userId: string): Promise<RecentScan[]> {
	const rows = await db
		.select({
			id: cartScans.id,
			shopName: cartScans.shopName,
			items: cartScans.items,
			createdAt: cartScans.createdAt,
		})
		.from(cartScans)
		.where(eq(cartScans.userId, userId))
		.orderBy(desc(cartScans.createdAt))
		.limit(5);

	return rows.map((r) => ({
		id: r.id,
		shopName: r.shopName,
		items: r.items as CartItem[],
		createdAt: r.createdAt,
	}));
}
