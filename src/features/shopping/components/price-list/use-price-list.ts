"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PriceListItem, ShopWithDelivery } from "@/shared/api/queries/get-price-list";
import { usePriceRows } from "./use-price-rows";

type Params = {
	items: PriceListItem[];
	shopOptions: ShopWithDelivery[];
	filterIds?: string[];
	hasProcessing?: boolean;
};

export function usePriceList({ items, shopOptions, filterIds, hasProcessing }: Params) {
	const router = useRouter();

	useEffect(() => {
		if (!hasProcessing) return;
		const interval = setInterval(() => router.refresh(), 5000);
		return () => clearInterval(interval);
	}, [hasProcessing, router]);

	const { visibleItems, sortedGroups, updateRow, handlePriceBlur, handleShopChange } = usePriceRows(
		{ items, shopOptions, filterIds },
	);

	const [shopEditTarget, setShopEditTarget] = useState<ShopWithDelivery | null | "new">(null);
	const [editItem, setEditItem] = useState<PriceListItem | null>(null);

	function openAddShop() {
		setShopEditTarget("new");
	}

	function openEditShop(shopId: string) {
		const shop = shopOptions.find((s) => s.id === shopId);
		if (shop) setShopEditTarget(shop);
	}

	function handleShopEditClose(open: boolean) {
		if (!open) setShopEditTarget(null);
	}

	function handleEditItem(id: string) {
		setEditItem(items.find((i) => i.id === id) ?? null);
	}

	function handleEditItemClose(open: boolean) {
		if (!open) setEditItem(null);
	}

	const supplementsForCart = visibleItems.map((i) => ({
		id: i.id,
		name: i.name,
		brandName: i.brandName ?? undefined,
	}));

	const shopsForCart = shopOptions.map((s) => ({ id: s.id, name: s.name }));

	return {
		sortedGroups,
		shopEditTarget,
		editItem,
		supplementsForCart,
		shopsForCart,
		updateRow,
		handlePriceBlur,
		handleShopChange,
		openAddShop,
		openEditShop,
		handleEditItem,
		handleShopEditClose,
		handleEditItemClose,
	};
}
