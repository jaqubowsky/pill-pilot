"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { updateSupplementPrices } from "@/features/shopping/api/actions/update-supplement-prices";
import type { PriceListItem, ShopOption } from "@/features/shopping/api/queries/get-price-list";

type PriceListRow = PriceListItem & {
	localPrice: string;
	localSize: string;
	localShopId: string | null;
};

type UsePriceListParams = {
	items: PriceListItem[];
	shopOptions: ShopOption[];
	filterIds?: string[];
};

export function usePriceList({ items, shopOptions, filterIds }: UsePriceListParams) {
	const visibleItems = useMemo(
		() => (filterIds ? items.filter((item) => filterIds.includes(item.id)) : items),
		[items, filterIds],
	);

	const [rows, setRows] = useState<PriceListRow[]>(() =>
		visibleItems.map((item) => ({
			...item,
			localPrice: item.packagePrice ?? "",
			localSize: item.packageSize?.toString() ?? "",
			localShopId: item.shopId,
		})),
	);

	const [shopEditTarget, setShopEditTarget] = useState<ShopOption | null | "new">(null);

	const groupedRows = useMemo(() => {
		const grouped = new Map<string | null, PriceListRow[]>();

		for (const row of rows) {
			const key = row.localShopId;
			const group = grouped.get(key) ?? [];
			group.push(row);
			grouped.set(key, group);
		}

		return grouped;
	}, [rows]);

	const updateRow = useCallback(
		(
			id: string,
			patch: Partial<Pick<PriceListRow, "localPrice" | "localSize" | "localShopId">>,
		) => {
			setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
		},
		[],
	);

	const saveField = useCallback(
		async (
			supplementId: string,
			field: "packagePrice" | "packageSize" | "shopId",
			value: string | null,
		) => {
			const update: {
				supplementId: string;
				packagePrice?: number;
				packageSize?: number;
				shopId?: string | null;
			} = { supplementId };

			if (field === "packagePrice") {
				const parsed = value ? parseFloat(value) : undefined;
				if (value && (Number.isNaN(parsed) || (parsed !== undefined && parsed <= 0))) return;
				update.packagePrice = parsed;
			} else if (field === "packageSize") {
				const parsed = value ? parseInt(value, 10) : undefined;
				if (value && (Number.isNaN(parsed) || (parsed !== undefined && parsed <= 0))) return;
				update.packageSize = parsed;
			} else if (field === "shopId") {
				update.shopId = value;
			}

			const result = await updateSupplementPrices({ updates: [update] });
			if (result?.serverError) {
				toast.error(result.serverError);
			}
		},
		[],
	);

	const handlePriceBlur = useCallback(
		(id: string, value: string) => {
			saveField(id, "packagePrice", value || null);
		},
		[saveField],
	);

	const handleSizeBlur = useCallback(
		(id: string, value: string) => {
			saveField(id, "packageSize", value || null);
		},
		[saveField],
	);

	const handleShopChange = useCallback(
		(id: string, shopId: string | null) => {
			updateRow(id, { localShopId: shopId });
			saveField(id, "shopId", shopId);
		},
		[updateRow, saveField],
	);

	const openAddShop = useCallback(() => {
		setShopEditTarget("new");
	}, []);

	const openEditShop = useCallback(
		(shopId: string) => {
			const shop = shopOptions.find((s) => s.id === shopId);
			if (shop) setShopEditTarget(shop);
		},
		[shopOptions],
	);

	const closeShopEdit = useCallback(() => {
		setShopEditTarget(null);
	}, []);

	return {
		rows,
		groupedRows,
		shopOptions,
		shopEditTarget,
		updateRow,
		handlePriceBlur,
		handleSizeBlur,
		handleShopChange,
		openAddShop,
		openEditShop,
		closeShopEdit,
	};
}
