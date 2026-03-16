"use client";

import { Pencil, Plus, ScanLine, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PriceListItem, ShopOption } from "@/features/shopping/api/queries/get-price-list";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { usePriceList } from "./use-price-list";

type PriceListProps = {
	items: PriceListItem[];
	shopOptions: ShopOption[];
	filterIds?: string[];
	onScanCart?: () => void;
};

export function PriceList({ items, shopOptions, filterIds, onScanCart }: PriceListProps) {
	const t = useTranslations();

	const {
		groupedRows,
		shopEditTarget,
		updateRow,
		handlePriceBlur,
		handleSizeBlur,
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

	return (
		<div className="flex flex-col gap-lg">
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					size="sm"
					onClick={onScanCart}
					className="flex items-center gap-xs"
				>
					<ScanLine className="size-4" />
					{t("shopping.scanCart")}
				</Button>

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
				<section key={shopId ?? "__none__"} className="flex flex-col gap-sm">
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
								className={`flex items-center gap-sm px-md min-h-12 ${idx < groupRows.length - 1 ? "border-b border-edge-subtle" : ""}`}
							>
								<span className="flex-1 text-sm text-content truncate min-w-0">{row.name}</span>
								<div className="flex items-center gap-xs shrink-0">
									<Input
										type="number"
										inputMode="decimal"
										min={0}
										step={0.01}
										placeholder="—"
										value={row.localPrice}
										onChange={(e) => updateRow(row.id, { localPrice: e.target.value })}
										onBlur={(e) => handlePriceBlur(row.id, e.target.value)}
										className="w-16 h-9 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
									/>
									<span className="text-xs text-content-faint shrink-0">zł</span>
									<Input
										type="number"
										inputMode="numeric"
										min={1}
										step={1}
										placeholder="—"
										value={row.localSize}
										onChange={(e) => updateRow(row.id, { localSize: e.target.value })}
										onBlur={(e) => handleSizeBlur(row.id, e.target.value)}
										className="w-14 h-9 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
									/>
									<span className="text-xs text-content-faint shrink-0">{t("stock.pieces")}</span>
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
