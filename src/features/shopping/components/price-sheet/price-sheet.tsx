"use client";

import { useTranslations } from "next-intl";
import { PriceList } from "../price-list";
import type { PriceListItem, ShopWithDelivery } from "@/shared/api/queries/get-price-list";
import { Button } from "@/shared/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";

type PriceSheetProps = {
	open: boolean;
	supplementIds: string[];
	items: PriceListItem[];
	shopOptions: ShopWithDelivery[];
	onClose: () => void;
};

export function PriceSheet({ open, supplementIds, items, shopOptions, onClose }: PriceSheetProps) {
	const t = useTranslations("shopping.priceSheet");

	return (
		<Sheet
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<SheetContent side="bottom" className="max-h-[90dvh] overflow-hidden flex flex-col">
				<SheetHeader>
					<SheetTitle>{t("title")}</SheetTitle>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-4">
					<PriceList items={items} shopOptions={shopOptions} filterIds={supplementIds} />
				</div>

				<SheetFooter>
					<Button onClick={onClose} className="w-full">
						{t("save")}
					</Button>
					<Button variant="outline" onClick={onClose} className="w-full">
						{t("later")}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
