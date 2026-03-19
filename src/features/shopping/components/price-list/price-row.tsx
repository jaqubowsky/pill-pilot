"use client";

import { Pencil, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { ShopOption } from "@/shared/types";
import type { PriceListRow } from "./use-price-rows";

const NO_SHOP_VALUE = "__none__";

type PriceRowProps = {
	row: PriceListRow;
	isLast: boolean;
	shopOptions: ShopOption[];
	onPriceChange: (id: string, value: string) => void;
	onPriceBlur: (id: string, value: string) => void;
	onShopChange: (id: string, shopId: string | null) => void;
	onAddShop: () => void;
	onEdit: (id: string) => void;
};

export function PriceRow({
	row,
	isLast,
	shopOptions,
	onPriceChange,
	onPriceBlur,
	onShopChange,
	onAddShop,
	onEdit,
}: PriceRowProps) {
	const t = useTranslations();

	return (
		<div
			className={`flex items-center justify-between gap-sm px-md py-xs min-h-11 ${!isLast ? "border-b border-edge-subtle" : ""}`}
		>
			<div className="flex flex-col min-w-0 flex-1">
				<span className="text-sm font-medium text-content truncate">{row.name}</span>
				{row.brandName && (
					<span className="text-xs text-content-faint truncate">{row.brandName}</span>
				)}
				{row.packageSize && (
					<span className="text-xs text-content-faint">
						{row.packageSize} {t(`schedule.units.${row.stockUnit}`)}
					</span>
				)}
			</div>

			<div className="flex items-center shrink-0">
				<Input
					type="number"
					inputMode="decimal"
					min={0}
					step={0.01}
					placeholder="—"
					value={row.localPrice}
					onChange={(e) => onPriceChange(row.id, e.target.value)}
					onBlur={(e) => onPriceBlur(row.id, e.target.value)}
					className="w-20 h-8 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
				/>
				<span className="text-xs text-content-faint ml-xs whitespace-nowrap">
					{t("common.currency")}
				</span>

				<div className="relative min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-surface-sunken active:scale-[0.98] transition-all ml-xs">
					<Store size={16} className="text-content-faint stroke-[1.5]" />
					<select
						value={row.localShopId ?? NO_SHOP_VALUE}
						onChange={(e) => {
							if (e.target.value === "__new__") {
								onAddShop();
								e.target.value = row.localShopId ?? NO_SHOP_VALUE;
								return;
							}
							onShopChange(row.id, e.target.value === NO_SHOP_VALUE ? null : e.target.value);
						}}
						className="absolute inset-0 opacity-0"
					>
						<option value={NO_SHOP_VALUE}>{t("shopping.noShop")}</option>
						{shopOptions.map((shop) => (
							<option key={shop.id} value={shop.id}>
								{shop.name}
							</option>
						))}
						<option value="__new__">+ {t("shopping.addShop")}</option>
					</select>
				</div>
				<Button variant="ghost" size="icon-sm" onClick={() => onEdit(row.id)} className="ml-xs">
					<Pencil className="size-3.5 text-content-faint stroke-[1.5]" />
				</Button>
			</div>
		</div>
	);
}
