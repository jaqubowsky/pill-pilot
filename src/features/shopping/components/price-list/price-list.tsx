"use client";

import { ImageUp, Pencil, Plus, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PriceListItem, ShopOption } from "@/features/shopping/api/queries/get-price-list";
import type { RecentScan } from "@/features/shopping/api/queries/get-recent-scans";
import { CartPriceSheet } from "@/features/shopping/components/cart-price-sheet";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { usePriceList } from "./use-price-list";

type PriceListProps = {
	items: PriceListItem[];
	shopOptions: ShopOption[];
	filterIds?: string[];
	recentScans?: RecentScan[];
};

const NO_SHOP_VALUE = "__none__";

export function PriceList({ items, shopOptions, filterIds, recentScans }: PriceListProps) {
	const t = useTranslations();

	const {
		groupedRows,
		shopEditTarget,
		updateRow,
		handlePriceBlur,
		handleShopChange,
		openAddShop,
		openEditShop,
		closeShopEdit,
	} = usePriceList({ items, shopOptions, filterIds });

	const shopMap = new Map(shopOptions.map((s) => [s.id, s]));

	type GroupRow =
		ReturnType<typeof usePriceList>["groupedRows"] extends Map<unknown, Array<infer R>> ? R : never;

	const sortedGroups: Array<{ shopId: string | null; shopName: string | null; rows: GroupRow[] }> =
		[];

	for (const [shopId, groupRows] of groupedRows) {
		const shopName = shopId ? (shopMap.get(shopId)?.name ?? null) : null;
		sortedGroups.push({ shopId, shopName, rows: groupRows });
	}

	sortedGroups.sort((a, b) => {
		if (a.shopId === null) return 1;
		if (b.shopId === null) return -1;
		return (a.shopName ?? "").localeCompare(b.shopName ?? "", "pl");
	});

	const supplementsForCart = items.map((i) => ({
		id: i.id,
		name: i.name,
		brandName: null as string | null,
	}));

	const shopsForCart = shopOptions.map((s) => ({ id: s.id, name: s.name }));

	return (
		<div className="flex flex-col gap-lg">
			<CartPriceSheet
				supplements={supplementsForCart}
				shops={shopsForCart}
				recentScans={recentScans}
				trigger={
					<div className="w-full flex flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed border-edge-strong bg-surface-sunken p-lg cursor-pointer active:scale-[0.98] transition-transform">
						<ImageUp className="size-8 text-content-faint stroke-[1.5]" />
						<p className="text-sm font-medium text-content-muted">{t("shopping.scanCart")}</p>
						<p className="text-xs text-content-faint">{t("shopping.scanCartHint")}</p>
					</div>
				}
			/>

			<div className="flex items-center gap-md">
				<div className="flex-1 border-t border-edge-subtle" />
				<span className="text-xs font-semibold uppercase tracking-wide text-content-faint">
					{t("shopping.or")}
				</span>
				<div className="flex-1 border-t border-edge-subtle" />
			</div>

			<Button
				variant="outline"
				size="lg"
				onClick={openAddShop}
				className="w-full flex items-center justify-center gap-sm rounded-xl bg-surface-raised border-edge-subtle shadow-sm"
			>
				<Plus className="size-5 text-brand-600" />
				<span className="text-sm font-medium text-content">{t("shopping.addShop")}</span>
			</Button>

			{sortedGroups.length === 0 && (
				<p className="text-sm text-content-muted text-center py-xl">{t("shopping.noPrices")}</p>
			)}

			{sortedGroups.map(({ shopId, shopName, rows: groupRows }) => (
				<section key={shopId ?? NO_SHOP_VALUE} className="flex flex-col gap-sm">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-xs">
							<Store size={16} strokeWidth={1.5} className="text-content-muted" />
							<span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
								{shopName ?? t("shopping.noShop")}
							</span>
						</div>

						{shopId && (
							<Button variant="ghost" size="icon-xs" onClick={() => openEditShop(shopId)}>
								<Pencil className="size-3.5 text-content-faint" />
							</Button>
						)}
					</div>

					<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm overflow-hidden">
						{groupRows.map((row, idx) => (
							<div
								key={row.id}
								className={`flex items-center justify-between gap-sm px-md py-xs min-h-11 ${idx < groupRows.length - 1 ? "border-b border-edge-subtle" : ""}`}
							>
								<span className="text-sm font-medium text-content truncate min-w-0 flex-1">
									{row.name}
								</span>

								<div className="flex items-center shrink-0">
									<Input
										type="number"
										inputMode="decimal"
										min={0}
										step={0.01}
										placeholder="—"
										value={row.localPrice}
										onChange={(e) => updateRow(row.id, { localPrice: e.target.value })}
										onBlur={(e) => handlePriceBlur(row.id, e.target.value)}
										className="w-20 h-8 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
									/>
									<span className="text-xs text-content-faint ml-xs whitespace-nowrap">zł</span>

									{shopOptions.length > 0 && (
										<div className="relative min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-surface-sunken active:scale-[0.98] transition-all ml-xs">
											<Store size={16} className="text-content-faint stroke-[1.5]" />
											<select
												value={row.localShopId ?? NO_SHOP_VALUE}
												onChange={(e) =>
													handleShopChange(
														row.id,
														e.target.value === NO_SHOP_VALUE ? null : e.target.value,
													)
												}
												className="absolute inset-0 opacity-0"
											>
												<option value={NO_SHOP_VALUE}>{t("shopping.noShop")}</option>
												{shopOptions.map((shop) => (
													<option key={shop.id} value={shop.id}>
														{shop.name}
													</option>
												))}
											</select>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</section>
			))}

			<ShopEditSheet
				shop={shopEditTarget === "new" ? null : shopEditTarget}
				open={shopEditTarget !== null}
				onOpenChange={(open) => {
					if (!open) closeShopEdit();
				}}
			/>
		</div>
	);
}
