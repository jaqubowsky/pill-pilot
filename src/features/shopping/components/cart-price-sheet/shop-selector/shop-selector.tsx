"use client";

import { Plus, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import type { ShopOption } from "../use-cart-price-sheet";
import { useShopSelector } from "./use-shop-selector";

type ShopSelectorProps = {
	shops: ShopOption[];
	selectedShopId: string | null;
	setSelectedShopId: (id: string | null) => void;
	setShopName: (name: string) => void;
	onAddShop: () => void;
};

export function ShopSelector({
	shops,
	selectedShopId,
	setSelectedShopId,
	setShopName,
	onAddShop,
}: ShopSelectorProps) {
	const t = useTranslations("shopping.cartPriceSheet");
	const { handleSelectShop, handleClearShop } = useShopSelector({
		shops,
		setSelectedShopId,
		setShopName,
	});

	if (selectedShopId) {
		return (
			<div className="flex items-center justify-between bg-surface-raised border border-edge-subtle rounded-xl p-md">
				<div className="flex items-center gap-xs">
					<Store size={16} className="text-content-muted" />
					<span className="text-sm font-medium text-content">
						{shops.find((s) => s.id === selectedShopId)?.name}
					</span>
				</div>
				<button type="button" onClick={handleClearShop} className="text-xs text-brand-600">
					{t("change")}
				</button>
			</div>
		);
	}

	return (
		<>
			{shops.length > 0 && (
				<>
					<select
						value=""
						onChange={handleSelectShop}
						className="w-full min-h-11 px-sm text-sm bg-surface-sunken border border-edge rounded-lg text-content appearance-none"
					>
						<option value="" disabled>
							{t("selectShop")}
						</option>
						{shops.map((shop) => (
							<option key={shop.id} value={shop.id}>
								{shop.name}
							</option>
						))}
					</select>

					<div className="flex items-center gap-md">
						<div className="flex-1 border-t border-edge-subtle" />
						<span className="text-xs font-semibold uppercase tracking-wide text-content-faint">
							{t("or")}
						</span>
						<div className="flex-1 border-t border-edge-subtle" />
					</div>
				</>
			)}

			<Button
				variant="outline"
				size="lg"
				className="w-full flex items-center justify-center gap-sm rounded-xl bg-surface-raised border-edge-subtle shadow-sm"
				onClick={onAddShop}
			>
				<Plus className="size-5 text-brand-600" />
				<span className="text-sm font-medium text-content">{t("addShop")}</span>
			</Button>
		</>
	);
}
