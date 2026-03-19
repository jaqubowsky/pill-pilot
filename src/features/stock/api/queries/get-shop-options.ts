import { shopRepository } from "@/shared/repositories/shop-repository";
import type { ShopOption } from "@/shared/types";

export async function getShopOptions(userId: string): Promise<ShopOption[]> {
	const shops = await shopRepository.findByUserId(userId);

	return shops.map((s) => ({ id: s.id, name: s.name }));
}
