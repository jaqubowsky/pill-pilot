"use client";

import { useTranslations } from "next-intl";
import type { LowStockItem } from "@/features/stock/api/queries/get-low-stock";
import { BuySoonItem } from "./buy-soon-item";

type BuySoonListProps = {
	items: LowStockItem[];
};

export function BuySoonList({ items }: BuySoonListProps) {
	const t = useTranslations("stock");

	if (items.length === 0) return null;

	return (
		<section className="flex flex-col gap-sm">
			<h2 className="text-xs font-semibold uppercase tracking-wide text-warning">
				{t("buySoon.title")}
			</h2>
			{items.map((item) => (
				<BuySoonItem key={item.id} item={item} />
			))}
		</section>
	);
}
