"use client";

import { ImageUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RecentScan } from "@/features/shopping/api/queries/get-recent-scans";
import { CartPriceSheet } from "@/features/shopping/components/cart-price-sheet";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { SupplementEditSheet } from "@/features/supplements";
import type { PriceListItem, ShopWithDelivery } from "@/shared/api/queries/get-price-list";
import { PriceGroup } from "./price-group";
import { usePriceList } from "./use-price-list";

type Props = {
	items: PriceListItem[];
	shopOptions: ShopWithDelivery[];
	filterIds?: string[];
	recentScans?: RecentScan[];
};

const NO_SHOP_VALUE = "__none__";

export function PriceList({ items, shopOptions, filterIds, recentScans }: Props) {
	const t = useTranslations();
	const hasProcessing = recentScans?.some((s) => s.status === "processing") ?? false;

	const {
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
	} = usePriceList({ items, shopOptions, filterIds, hasProcessing });

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

			{sortedGroups.length === 0 && (
				<p className="text-sm text-content-muted text-center py-xl">{t("shopping.noPrices")}</p>
			)}

			{sortedGroups.map((group) => (
				<PriceGroup
					key={group.shopId ?? NO_SHOP_VALUE}
					group={group}
					shopOptions={shopOptions}
					onPriceChange={(id, value) => updateRow(id, { localPrice: value })}
					onPriceBlur={handlePriceBlur}
					onShopChange={handleShopChange}
					onAddShop={openAddShop}
					onEditShop={openEditShop}
					onEditItem={handleEditItem}
				/>
			))}

			<ShopEditSheet
				shop={shopEditTarget === "new" ? null : shopEditTarget}
				open={shopEditTarget !== null}
				onOpenChange={handleShopEditClose}
			/>

			<SupplementEditSheet
				supplement={editItem ?? null}
				open={editItem !== null}
				onOpenChange={handleEditItemClose}
				shops={shopsForCart}
			/>
		</div>
	);
}
