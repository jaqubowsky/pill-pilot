"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createShop } from "@/features/shopping/api/actions/manage-shop";
import { updateSupplementPrices } from "@/features/shopping/api/actions/update-supplement-prices";
import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";

const CART_CONFIDENCE_THRESHOLD = 0.8;

export type CartItemState = CartItem & {
	_id: string;
	verified: boolean;
	skipped: boolean;
};

export type SupplementOption = {
	id: string;
	name: string;
	brandName?: string | null;
};

export type ShopOption = {
	id: string;
	name: string;
};

type UseCartPriceSheetParams = {
	supplements: SupplementOption[];
	shops: ShopOption[];
	onSaved: () => void;
};

export function useCartPriceSheet({ supplements, shops, onSaved }: UseCartPriceSheetParams) {
	const [isOpen, setIsOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [items, setItems] = useState<CartItemState[]>([]);
	const [detectedShopName, setDetectedShopName] = useState<string>("");
	const [shopName, setShopName] = useState<string>("");
	const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

	function openSheet() {
		setIsOpen(true);
	}

	function closeSheet() {
		setIsOpen(false);
		setItems([]);
		setDetectedShopName("");
		setShopName("");
		setSelectedShopId(null);
	}

	async function handleFileUpload(file: File) {
		setIsUploading(true);
		setIsOpen(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append(
				"supplements",
				JSON.stringify(
					supplements.map((s) => ({ id: s.id, name: s.name, brandName: s.brandName })),
				),
			);

			const response = await fetch("/api/cart/parse", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				toast.error("Nie udało się przeanalizować zrzutu. Spróbuj ponownie.");
				setIsUploading(false);
				setIsOpen(false);
				return;
			}

			const data = await response.json();

			const cartItems: CartItemState[] = (data.items ?? []).map((item: CartItem, i: number) => ({
				...item,
				_id: `ci_${i}_${Date.now()}`,
				verified: item.confidence >= CART_CONFIDENCE_THRESHOLD,
				skipped: false,
			}));

			setItems(cartItems);

			if (data.shopName) {
				setDetectedShopName(data.shopName);
				setShopName(data.shopName);

				const existingShop = shops.find(
					(s) => s.name.toLowerCase() === data.shopName.toLowerCase(),
				);
				if (existingShop) {
					setSelectedShopId(existingShop.id);
				}
			}
		} catch {
			toast.error("Nie udało się przeanalizować zrzutu. Spróbuj ponownie.");
			setIsOpen(false);
		} finally {
			setIsUploading(false);
		}
	}

	function handleMatchChange(itemId: string, supplementId: string | null) {
		setItems((prev) =>
			prev.map((item) =>
				item._id === itemId
					? {
							...item,
							matchedSupplementId: supplementId,
							verified: supplementId !== null,
						}
					: item,
			),
		);
	}

	function handleVerify(itemId: string) {
		setItems((prev) =>
			prev.map((item) => (item._id === itemId ? { ...item, verified: true } : item)),
		);
	}

	function handleSkip(itemId: string) {
		setItems((prev) =>
			prev.map((item) => (item._id === itemId ? { ...item, skipped: true, verified: true } : item)),
		);
	}

	function handleUnskip(itemId: string) {
		setItems((prev) =>
			prev.map((item) =>
				item._id === itemId ? { ...item, skipped: false, verified: false } : item,
			),
		);
	}

	const unverifiedCount = items.filter((i) => !i.verified && !i.skipped).length;
	const canSave = unverifiedCount === 0 && items.length > 0;

	async function handleSave() {
		if (!canSave) return;

		setIsSaving(true);

		try {
			let shopId = selectedShopId;

			if (shopName.trim() && !shopId) {
				const result = await createShop({ name: shopName.trim() });
				if (result?.data?.shop) {
					shopId = result.data.shop.id;
				}
			}

			const updates = items
				.filter((item) => !item.skipped && item.matchedSupplementId)
				.map((item) => ({
					supplementId: item.matchedSupplementId as string,
					packagePrice: item.price,
					...(shopId ? { shopId } : {}),
				}));

			if (updates.length > 0) {
				await updateSupplementPrices({ updates });
			}

			closeSheet();
			onSaved();
		} catch {
			toast.error("generic");
		} finally {
			setIsSaving(false);
		}
	}

	return {
		isOpen,
		isUploading,
		isSaving,
		items,
		detectedShopName,
		shopName,
		setShopName,
		selectedShopId,
		setSelectedShopId,
		unverifiedCount,
		canSave,
		openSheet,
		closeSheet,
		handleFileUpload,
		handleMatchChange,
		handleVerify,
		handleSkip,
		handleUnskip,
		handleSave,
		CART_CONFIDENCE_THRESHOLD,
	};
}
