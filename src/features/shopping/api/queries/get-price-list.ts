import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { shops, supplements } from "@/shared/db/schema";

export type PriceListItem = {
	id: string;
	name: string;
	stockUnit: string;
	packagePrice: string | null;
	packageSize: number | null;
	shopId: string | null;
	shopName: string | null;
};

export type ShopOption = {
	id: string;
	name: string;
	deliveryCost: string | null;
	freeDeliveryThreshold: string | null;
};

export type PriceListData = {
	items: PriceListItem[];
	shopOptions: ShopOption[];
};

export async function getPriceList(userId: string): Promise<PriceListData> {
	const items = await db
		.select({
			id: supplements.id,
			name: supplements.name,
			stockUnit: supplements.stockUnit,
			packagePrice: supplements.packagePrice,
			packageSize: supplements.packageSize,
			shopId: supplements.shopId,
			shopName: shops.name,
		})
		.from(supplements)
		.leftJoin(shops, eq(supplements.shopId, shops.id))
		.where(and(eq(supplements.userId, userId), eq(supplements.active, true)))
		.orderBy(supplements.name);

	const shopOptions = await db
		.select({
			id: shops.id,
			name: shops.name,
			deliveryCost: shops.deliveryCost,
			freeDeliveryThreshold: shops.freeDeliveryThreshold,
		})
		.from(shops)
		.where(eq(shops.userId, userId))
		.orderBy(shops.name);

	return { items, shopOptions };
}
