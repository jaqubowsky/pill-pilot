"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RecentScan } from "@/features/shopping/api/queries/get-recent-scans";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { Button } from "@/shared/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import type { ShopOption } from "@/shared/types";
import { CartErrorState } from "./cart-error-state";
import { CartItemsList } from "./cart-items-list";
import { CartUploadTrigger } from "./cart-upload";
import { RecentScansList } from "./recent-scans-list";
import { useCartItems } from "./use-cart-items";
import type { SupplementOption } from "./use-cart-price-sheet";
import { useCartPriceSheet } from "./use-cart-price-sheet";
import { useCartShop } from "./use-cart-shop";

type Props = {
	supplements: SupplementOption[];
	shops: ShopOption[];
	recentScans?: RecentScan[];
	trigger?: React.ReactNode;
};

export function CartPriceSheet({ supplements, shops, recentScans, trigger }: Props) {
	const t = useTranslations("shopping.cartPriceSheet");
	const [shopEditOpen, setShopEditOpen] = useState(false);

	const cartItems = useCartItems();
	const cartShop = useCartShop(shops);

	const {
		isOpen,
		isSaving,
		error,
		localSupplements,
		handleCreateSupplement,
		canSave,
		closeSheet,
		loadScan,
		handleSave,
	} = useCartPriceSheet({ supplements, cartItems, cartShop });

	return (
		<>
			<CartUploadTrigger supplements={supplements} trigger={trigger} />

			{recentScans && recentScans.length > 0 && (
				<RecentScansList recentScans={recentScans} loadScan={loadScan} />
			)}

			<Sheet
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) closeSheet();
				}}
			>
				<SheetContent
					side="bottom"
					className="max-h-[90dvh] overflow-hidden flex flex-col gap-0 p-0"
				>
					<SheetHeader className="shrink-0 px-md pt-lg pb-md">
						<SheetTitle>{t("title")}</SheetTitle>
					</SheetHeader>

					{error ? (
						<CartErrorState message={error} />
					) : (
						<CartItemsList
							shops={shops}
							cartItems={cartItems}
							localSupplements={localSupplements}
							selectedShopId={cartShop.selectedShopId}
							setSelectedShopId={cartShop.setSelectedShopId}
							setShopName={cartShop.setShopName}
							onAddShop={() => setShopEditOpen(true)}
							onCreateSupplement={handleCreateSupplement}
						/>
					)}

					<SheetFooter className="shrink-0 flex flex-col gap-sm p-md mt-0">
						<Button onClick={handleSave} disabled={!canSave || isSaving} className="w-full">
							{isSaving ? t("saving") : t("savePrices")}
						</Button>
						<Button variant="outline" onClick={closeSheet} className="w-full">
							{t("cancel")}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<ShopEditSheet shop={null} open={shopEditOpen} onOpenChange={setShopEditOpen} />
		</>
	);
}
