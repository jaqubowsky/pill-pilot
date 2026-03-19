import { desc, eq } from "drizzle-orm";
import { type CartItem, cartParseSchema } from "@/features/shopping/schemas/cart-parse-schema";
import { db } from "@/shared/db/client";
import type { CartScanStatus } from "@/shared/db/schema";
import { cartScans } from "@/shared/db/schema";

export type RecentScan = {
	id: string;
	status: CartScanStatus;
	shopName: string | null;
	items: CartItem[];
	createdAt: Date;
};

export async function getRecentScans(userId: string): Promise<RecentScan[]> {
	const rows = await db
		.select({
			id: cartScans.id,
			status: cartScans.status,
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
		status: r.status,
		shopName: r.shopName,
		items: cartParseSchema.shape.items.catch([]).parse(r.items),
		createdAt: r.createdAt,
	}));
}
