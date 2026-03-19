"use client";

import { Pencil, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import type { ShopOption } from "@/shared/types";
import { PriceRow } from "./price-row";
import type { PriceListGroup } from "./use-price-rows";

type PriceGroupProps = {
	group: PriceListGroup;
	shopOptions: ShopOption[];
	onPriceChange: (id: string, value: string) => void;
	onPriceBlur: (id: string, value: string) => void;
	onShopChange: (id: string, shopId: string | null) => void;
	onAddShop: () => void;
	onEditShop: (shopId: string) => void;
	onEditItem: (id: string) => void;
};

export function PriceGroup({
	group,
	shopOptions,
	onPriceChange,
	onPriceBlur,
	onShopChange,
	onAddShop,
	onEditShop,
	onEditItem,
}: PriceGroupProps) {
	const t = useTranslations();

	return (
		<section className="flex flex-col gap-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-xs">
					<Store size={16} strokeWidth={1.5} className="text-content-muted" />
					<span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
						{group.shopName ?? t("shopping.noShop")}
					</span>
				</div>

				{group.shopId && (
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => {
							if (group.shopId) onEditShop(group.shopId);
						}}
					>
						<Pencil className="size-3.5 text-content-faint" />
					</Button>
				)}
			</div>

			<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm overflow-hidden">
				{group.rows.map((row, idx) => (
					<PriceRow
						key={row.id}
						row={row}
						isLast={idx === group.rows.length - 1}
						shopOptions={shopOptions}
						onPriceChange={onPriceChange}
						onPriceBlur={onPriceBlur}
						onShopChange={onShopChange}
						onAddShop={onAddShop}
						onEdit={onEditItem}
					/>
				))}
			</div>
		</section>
	);
}
