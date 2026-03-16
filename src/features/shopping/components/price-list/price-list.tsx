"use client";

import { Pencil, Plus, ScanLine, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PriceListItem, ShopOption } from "@/features/shopping/api/queries/get-price-list";
import { CartPriceSheet } from "@/features/shopping/components/cart-price-sheet";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { usePriceList } from "./use-price-list";

type PriceListProps = {
	items: PriceListItem[];
	shopOptions: ShopOption[];
	filterIds?: string[];
};

const NO_SHOP_VALUE = "__none__";

export function PriceList({ items, shopOptions, filterIds }: PriceListProps) {
	const t = useTranslations();

	const {
		groupedRows,
		shopEditTarget,
		updateRow,
		handlePriceBlur,
		handleSizeBlur,
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
			<div className="flex items-center justify-between">
				<CartPriceSheet
					supplements={supplementsForCart}
					shops={shopsForCart}
					trigger={
						<Button variant="outline" size="sm" className="flex items-center gap-xs">
							<ScanLine className="size-4" />
							{t("shopping.scanCart")}
						</Button>
					}
				/>

				<Button
					variant="ghost"
					size="sm"
					onClick={openAddShop}
					className="flex items-center gap-xs text-brand-600"
				>
					<Plus className="size-4" />
					{t("shopping.addShop")}
				</Button>
			</div>

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
								className={`flex flex-col gap-xs px-md py-sm ${idx < groupRows.length - 1 ? "border-b border-edge-subtle" : ""}`}
							>
								<div className="flex items-center justify-between gap-sm">
									<span className="text-sm font-medium text-content truncate min-w-0 flex-1">
										{row.name}
									</span>
									{shopOptions.length > 0 && (
										<Select
											value={row.localShopId ?? NO_SHOP_VALUE}
											onValueChange={(val) =>
												handleShopChange(row.id, val === NO_SHOP_VALUE ? null : val)
											}
										>
											<SelectTrigger
												size="sm"
												className="w-auto h-6 text-xs text-content-faint bg-transparent border-none gap-xs px-0 shrink-0 ml-auto"
											>
												<Store size={12} className="text-content-faint shrink-0" />
												<SelectValue>
													{row.localShopId
														? (shopMap.get(row.localShopId)?.name ?? t("shopping.pickShop"))
														: t("shopping.noShop")}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NO_SHOP_VALUE}>{t("shopping.noShop")}</SelectItem>
												{shopOptions.map((shop) => (
													<SelectItem key={shop.id} value={shop.id}>
														{shop.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</div>
								<div className="flex items-center gap-sm">
									<Input
										type="number"
										inputMode="decimal"
										min={0}
										step={0.01}
										placeholder="—"
										value={row.localPrice}
										onChange={(e) => updateRow(row.id, { localPrice: e.target.value })}
										onBlur={(e) => handlePriceBlur(row.id, e.target.value)}
										className="w-20 h-9 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
									/>
									<span className="text-xs text-content-faint">zł</span>
									<Input
										type="number"
										inputMode="numeric"
										min={1}
										step={1}
										placeholder="—"
										value={row.localSize}
										onChange={(e) => updateRow(row.id, { localSize: e.target.value })}
										onBlur={(e) => handleSizeBlur(row.id, e.target.value)}
										className="w-16 h-9 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
									/>
									<span className="text-xs text-content-faint">{t("stock.pieces")}</span>
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
