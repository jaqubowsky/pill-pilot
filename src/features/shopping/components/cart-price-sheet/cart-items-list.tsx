"use client";

import { useTranslations } from "next-intl";
import { CART_CONFIDENCE_THRESHOLD } from "@/features/shopping/lib/cart-logic";
import type { ShopOption } from "@/shared/types";
import { CartItemRow } from "./cart-item-row";
import { ShopSelector } from "./shop-selector";
import type { useCartItems } from "./use-cart-items";
import type { SupplementOption } from "./use-cart-price-sheet";

type Props = {
	shops: ShopOption[];
	cartItems: ReturnType<typeof useCartItems>;
	localSupplements: SupplementOption[];
	selectedShopId: string | null;
	setSelectedShopId: (id: string | null) => void;
	setShopName: (name: string) => void;
	onAddShop: () => void;
	onCreateSupplement: (name: string) => Promise<string | null>;
};

export function CartItemsList({
	shops,
	cartItems,
	localSupplements,
	selectedShopId,
	setSelectedShopId,
	setShopName,
	onAddShop,
	onCreateSupplement,
}: Props) {
	const t = useTranslations("shopping.cartPriceSheet");

	return (
		<div className="flex-1 overflow-y-auto px-md pb-lg pt-md">
			<div className="flex flex-col gap-md">
				<div className="flex flex-col gap-sm">
					<label className="text-xs font-medium text-content-muted">{t("shopLabel")}</label>
					<ShopSelector
						shops={shops}
						selectedShopId={selectedShopId}
						setSelectedShopId={setSelectedShopId}
						setShopName={setShopName}
						onAddShop={onAddShop}
					/>
				</div>

				{cartItems.unverifiedCount > 0 && (
					<div className="rounded-xl bg-warning-bg border border-warning/20 p-md">
						<p className="text-sm text-warning-text">
							{t("requiresVerification", { count: cartItems.unverifiedCount })}
						</p>
					</div>
				)}

				<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm overflow-hidden px-md">
					{cartItems.items.map((item, idx) => (
						<div
							key={item._id}
							className={idx < cartItems.items.length - 1 ? "border-b border-edge-subtle" : ""}
						>
							<CartItemRow
								item={item}
								supplements={localSupplements}
								confidenceThreshold={CART_CONFIDENCE_THRESHOLD}
								onMatch={(id) => cartItems.handleMatchChange(item._id, id)}
								onPriceChange={(price) => cartItems.handlePriceChange(item._id, price)}
								onVerify={() => cartItems.handleVerify(item._id)}
								onSkip={() => cartItems.handleSkip(item._id)}
								onUnskip={() => cartItems.handleUnskip(item._id)}
								onCreateNew={onCreateSupplement}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
