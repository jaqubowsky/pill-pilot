"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { createShop } from "@/features/shopping/api/actions/create-shop";
import { deleteCartScan } from "@/features/shopping/api/actions/delete-cart-scan";
import { updateSupplementPrices } from "@/features/shopping/api/actions/update-supplement-prices";
import {
	buildPriceUpdates,
	CART_CONFIDENCE_THRESHOLD,
	type CartItemState,
	canSaveCart,
	type ShopOption,
} from "@/features/shopping/lib/cart-logic";
import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";
import { addSupplement } from "@/features/supplements";
import type { useCartItems } from "./use-cart-items";
import type { useCartShop } from "./use-cart-shop";

export type { CartItemState, ShopOption };
export { CART_CONFIDENCE_THRESHOLD };

export type SupplementOption = {
	id: string;
	name: string;
	brandName?: string | null;
};

type Params = {
	supplements: SupplementOption[];
	cartItems: ReturnType<typeof useCartItems>;
	cartShop: ReturnType<typeof useCartShop>;
};

export function useCartPriceSheet({ supplements, cartItems, cartShop }: Params) {
	const t = useTranslations("shopping.cartPriceSheet");
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadedScanId, setLoadedScanId] = useState<string | null>(null);
	const [localSupplements, setLocalSupplements] = useState<SupplementOption[]>(supplements);

	const { executeAsync: execCreateShop } = useAction(createShop);
	const { executeAsync: execUpdatePrices } = useAction(updateSupplementPrices);
	const { executeAsync: execDeleteScan } = useAction(deleteCartScan);

	function closeSheet() {
		setIsOpen(false);
		setError(null);
		setLoadedScanId(null);
		cartItems.clearItems();
		cartShop.clearShop();
	}

	function loadScan(data: { scanId: string; shopName: string | null; items: CartItem[] }) {
		setLoadedScanId(data.scanId);
		setError(null);
		cartItems.loadItems(data.items);
		if (data.shopName) cartShop.detectShop(data.shopName);
		setIsOpen(true);
	}

	async function handleCreateSupplement(name: string): Promise<string | null> {
		const result = await addSupplement({ name, category: "supplement", stockUnit: "capsule" });
		if (result?.data?.supplementId) {
			const newId = result.data.supplementId;
			setLocalSupplements((prev) => [...prev, { id: newId, name }]);
			return newId;
		}
		toast.error(t("createSupplementError"));
		return null;
	}

	const canSave = canSaveCart(cartItems.items, cartShop.selectedShopId, cartShop.shopName);

	async function handleSave() {
		if (!canSave) return;
		setIsSaving(true);

		try {
			let shopId = cartShop.selectedShopId;

			if (cartShop.shopName.trim() && !shopId) {
				const result = await execCreateShop({ name: cartShop.shopName.trim() });
				if (result?.data?.shop) shopId = result.data.shop.id;
			}

			const updates = buildPriceUpdates(cartItems.items, shopId);
			if (updates.length > 0) await execUpdatePrices({ updates });
			if (loadedScanId) await execDeleteScan({ scanId: loadedScanId });

			closeSheet();
		} catch {
			toast.error(t("saveError"));
		} finally {
			setIsSaving(false);
		}
	}

	return {
		isOpen,
		isSaving,
		error,
		localSupplements,
		handleCreateSupplement,
		canSave,
		closeSheet,
		loadScan,
		handleSave,
	};
}
