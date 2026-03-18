"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StockList } from "@/features/stock/api/queries/get-stock-list";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { StockItem } from "./stock-item";
import { SupplementEditSheet } from "./supplement-edit-sheet";
import { useStockList } from "./use-stock-list";

type ShopOption = {
	id: string;
	name: string;
};

type StockListProps = {
	data: StockList;
	shops?: ShopOption[];
};

export function StockListView({ data, shops }: StockListProps) {
	const t = useTranslations();

	const { isEmpty, addOpen, setAddOpen, openAddSheet, navigateToNewProtocol } = useStockList(data);

	if (isEmpty) {
		return (
			<div className="flex flex-col items-center justify-center gap-lg py-2xl text-center px-md">
				<div className="text-brand-300">
					<Package size={64} strokeWidth={1.5} />
				</div>
				<div className="flex flex-col gap-sm">
					<h2 className="font-display text-xl text-content-muted">{t("stock.emptyTitle")}</h2>
					<p className="text-sm text-content-faint">{t("stock.emptyDescription")}</p>
				</div>
				<div className="flex flex-col gap-sm w-full">
					<Button
						variant="default"
						className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
						onClick={navigateToNewProtocol}
					>
						{t("common.uploadProtocol")}
					</Button>
					<Button
						variant="ghost"
						className="w-full text-brand-600 rounded-lg px-lg py-sm text-sm font-medium"
						onClick={openAddSheet}
					>
						{t("stock.addManually")}
					</Button>
				</div>

				<SupplementEditSheet
					supplement={null}
					open={addOpen}
					onOpenChange={setAddOpen}
					shops={shops}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-md">
			{data.tracked.map((item) => (
				<StockItem key={item.id} item={item} shops={shops} />
			))}

			{data.untracked.length > 0 && (
				<>
					{data.tracked.length > 0 && (
						<div className="flex items-center gap-md">
							<Separator className="flex-1 border-edge-subtle" />
							<span className="text-xs text-content-faint font-semibold uppercase tracking-wide shrink-0">
								{t("stock.noTracking")}
							</span>
							<Separator className="flex-1 border-edge-subtle" />
						</div>
					)}
					{data.tracked.length === 0 && (
						<p className="text-xs text-content-faint font-semibold uppercase tracking-wide">
							{t("stock.noTracking")}
						</p>
					)}
					{data.untracked.map((item) => (
						<StockItem key={item.id} item={item} shops={shops} />
					))}
				</>
			)}

			<Button
				variant="default"
				className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
				onClick={openAddSheet}
			>
				+ {t("common.addSupplement")}
			</Button>

			<SupplementEditSheet
				supplement={null}
				open={addOpen}
				onOpenChange={setAddOpen}
				shops={shops}
			/>
		</div>
	);
}
