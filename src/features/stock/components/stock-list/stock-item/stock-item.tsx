"use client";

import { useTranslations } from "next-intl";
import type { StockListItem } from "@/features/stock/api/queries/get-stock-list";
import { Button } from "@/shared/components/ui/button";
import type { ShopOption } from "@/shared/types";
import { AdjustDialog } from "../adjust-dialog";
import { RestockDialog } from "../restock-dialog";
import { StockProgressBar } from "../stock-progress-bar";
import { SupplementEditSheet } from "../supplement-edit-sheet";
import { StockQuantity } from "./stock-quantity";
import { useStockItem } from "./use-stock-item";

type StockItemProps = {
	item: StockListItem;
	shops?: ShopOption[];
};

export function StockItem({ item, shops }: StockItemProps) {
	const t = useTranslations();

	const { restockOpen, setRestockOpen, adjustOpen, setAdjustOpen, editOpen, setEditOpen } =
		useStockItem();

	return (
		<>
			<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm">
				<div className="flex flex-col gap-xs p-md">
					<p className="text-sm font-bold text-content truncate">{item.name}</p>
					{item.brandName && (
						<p className="text-sm text-content-muted truncate">{item.brandName}</p>
					)}
					{item.currentStock !== null && (
						<>
							<StockQuantity
								currentStock={item.currentStock}
								packageSize={item.packageSize}
								stockUnit={item.stockUnit}
							/>
							<StockProgressBar
								currentStock={Number(item.currentStock)}
								daysInStock={item.daysInStock}
								dailyUsage={item.dailyUsage}
								packageSize={item.packageSize}
							/>
						</>
					)}
				</div>

				<div className="flex border-t border-edge-subtle">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setEditOpen(true)}
						className="flex-1 text-brand-600 text-sm rounded-none rounded-bl-xl py-md"
					>
						{t("common.edit")}
					</Button>
					{item.currentStock !== null && (
						<>
							<div className="w-px bg-edge-subtle" />
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setRestockOpen(true)}
								className="flex-1 text-brand-600 text-sm rounded-none py-md"
							>
								{t("common.restock")}
							</Button>
							<div className="w-px bg-edge-subtle" />
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setAdjustOpen(true)}
								className="flex-1 text-brand-600 text-sm rounded-none rounded-br-xl py-md"
							>
								{t("common.adjust")}
							</Button>
						</>
					)}
				</div>
			</div>

			<RestockDialog
				supplementId={item.id}
				supplementName={item.name}
				stockUnit={item.stockUnit}
				open={restockOpen}
				onOpenChange={setRestockOpen}
			/>

			<AdjustDialog
				supplementId={item.id}
				supplementName={item.name}
				currentStock={item.currentStock}
				stockUnit={item.stockUnit}
				open={adjustOpen}
				onOpenChange={setAdjustOpen}
			/>

			<SupplementEditSheet
				supplement={item}
				open={editOpen}
				onOpenChange={setEditOpen}
				shops={shops}
			/>
		</>
	);
}
