"use client";

import { useState } from "react";
import { matchShopByName } from "@/features/shopping/lib/cart-logic";
import type { ShopOption } from "@/shared/types";

export function useCartShop(shops: ShopOption[]) {
	const [shopName, setShopName] = useState("");
	const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

	function detectShop(name: string) {
		setShopName(name);
		const existingId = matchShopByName(name, shops);
		if (existingId) setSelectedShopId(existingId);
	}

	function clearShop() {
		setShopName("");
		setSelectedShopId(null);
	}

	return {
		shopName,
		setShopName,
		selectedShopId,
		setSelectedShopId,
		detectShop,
		clearShop,
	};
}
