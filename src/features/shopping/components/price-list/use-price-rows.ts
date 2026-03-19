"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { updateSupplementPrices } from "@/features/shopping/api/actions/update-supplement-prices";
import type { ShopOption } from "@/shared/types";
import type { PriceListItem } from "../../api/queries/get-price-list";

export type PriceListRow = PriceListItem & {
	localPrice: string;
	localShopId: string | null;
};

export type PriceListGroup = {
	shopId: string | null;
	shopName: string | null;
	rows: PriceListRow[];
};

type Params = {
	items: PriceListItem[];
	shopOptions: ShopOption[];
	filterIds?: string[];
};

export function usePriceRows({ items, shopOptions, filterIds }: Params) {
	const visibleItems = useMemo(
		() => (filterIds ? items.filter((item) => filterIds.includes(item.id)) : items),
		[items, filterIds],
	);

	const [rows, setRows] = useState<PriceListRow[]>(() =>
		visibleItems.map((item) => ({
			...item,
			localPrice: item.packagePrice ?? "",
			localShopId: item.shopId,
		})),
	);

	const serverValues = useRef(
		new Map(
			visibleItems.map((item) => [
				item.id,
				{ price: item.packagePrice ?? "", shopId: item.shopId },
			]),
		),
	);

	const sortedGroups = useMemo(() => {
		const grouped = new Map<string | null, PriceListRow[]>();
		for (const row of rows) {
			const group = grouped.get(row.localShopId) ?? [];
			group.push(row);
			grouped.set(row.localShopId, group);
		}

		const shopMap = new Map(shopOptions.map((s) => [s.id, s]));
		const groups: PriceListGroup[] = [];
		for (const [shopId, groupRows] of grouped) {
			groups.push({
				shopId,
				shopName: shopId ? (shopMap.get(shopId)?.name ?? null) : null,
				rows: groupRows,
			});
		}

		groups.sort((a, b) => {
			if (a.shopId === null) return 1;
			if (b.shopId === null) return -1;
			return (a.shopName ?? "").localeCompare(b.shopName ?? "", "pl");
		});

		return groups;
	}, [rows, shopOptions]);

	function updateRow(id: string, patch: Partial<Pick<PriceListRow, "localPrice" | "localShopId">>) {
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	}

	async function handlePriceBlur(id: string, value: string) {
		const sv = serverValues.current.get(id);
		if ((value || "") === (sv?.price || "")) return;

		const parsed = value ? parseFloat(value) : undefined;
		if (value && (Number.isNaN(parsed) || (parsed !== undefined && parsed <= 0))) return;

		const result = await updateSupplementPrices({
			updates: [{ supplementId: id, packagePrice: parsed }],
		});
		if (result?.serverError) {
			toast.error(result.serverError);
			return;
		}
		if (sv) sv.price = value || "";
	}

	async function handleShopChange(id: string, shopId: string | null) {
		updateRow(id, { localShopId: shopId });

		const sv = serverValues.current.get(id);
		if (shopId === (sv?.shopId ?? null)) return;

		const result = await updateSupplementPrices({
			updates: [{ supplementId: id, shopId }],
		});
		if (result?.serverError) {
			toast.error(result.serverError);
			return;
		}
		if (sv) sv.shopId = shopId;
	}

	return {
		visibleItems,
		sortedGroups,
		updateRow,
		handlePriceBlur,
		handleShopChange,
	};
}
