"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteCartScan } from "@/features/shopping/api/actions/delete-cart-scan";
import { createShop } from "@/features/shopping/api/actions/manage-shop";
import { updateSupplementPrices } from "@/features/shopping/api/actions/update-supplement-prices";
import {
	type CartItemState,
	type ShopOption,
	CART_CONFIDENCE_THRESHOLD,
	applyMatch,
	applyPriceChange,
	applySkip,
	applyUnskip,
	applyVerify,
	buildPriceUpdates,
	canSaveCart,
	getUnverifiedCount,
	matchShopByName,
	toCartItemStates,
} from "@/features/shopping/lib/cart-logic";
import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";
import { addSupplement } from "@/features/supplements";

export type { CartItemState, ShopOption };
export { CART_CONFIDENCE_THRESHOLD };

export type SupplementOption = {
	id: string;
	name: string;
	brandName?: string | null;
};

type UseCartPriceSheetParams = {
	supplements: SupplementOption[];
	shops: ShopOption[];
	onSaved: () => void;
};

export function useCartPriceSheet({ supplements, shops, onSaved }: UseCartPriceSheetParams) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<CartItemState[]>([]);
	const [localSupplements, setLocalSupplements] = useState<SupplementOption[]>(supplements);
	const [detectedShopName, setDetectedShopName] = useState<string>("");
	const [shopName, setShopName] = useState<string>("");
	const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
	const [shopDeliveryCost, setShopDeliveryCost] = useState<string>("");
	const [shopFreeThreshold, setShopFreeThreshold] = useState<string>("");
	const [loadedScanId, setLoadedScanId] = useState<string | null>(null);

	function closeSheet() {
		setIsOpen(false);
		setItems([]);
		setError(null);
		setDetectedShopName("");
		setShopName("");
		setSelectedShopId(null);
		setShopDeliveryCost("");
		setShopFreeThreshold("");
		setLoadedScanId(null);
	}

	function loadScan(data: { scanId: string; shopName: string | null; items: CartItem[] }) {
		setLoadedScanId(data.scanId);
		setItems(toCartItemStates(data.items));
		setError(null);

		if (data.shopName) {
			setDetectedShopName(data.shopName);
			setShopName(data.shopName);

			const existingShopId = matchShopByName(data.shopName, shops);
			if (existingShopId) {
				setSelectedShopId(existingShopId);
			}
		}

		setIsOpen(true);
	}

	async function handleFileUpload(file: File) {
		const formData = new FormData();
		formData.append("file", file);
		formData.append(
			"supplements",
			JSON.stringify(supplements.map((s) => ({ id: s.id, name: s.name, brandName: s.brandName }))),
		);

		try {
			const response = await fetch("/api/cart/parse", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				toast.error("Nie udało się rozpocząć analizy. Spróbuj ponownie.");
			}
		} catch {
			toast.error("Nie udało się rozpocząć analizy. Spróbuj ponownie.");
		}
	}

	function handleMatchChange(itemId: string, supplementId: string | null) {
		setItems((prev) => applyMatch(prev, itemId, supplementId));
	}

	function handlePriceChange(itemId: string, price: number) {
		setItems((prev) => applyPriceChange(prev, itemId, price));
	}

	function handleVerify(itemId: string) {
		setItems((prev) => applyVerify(prev, itemId));
	}

	function handleSkip(itemId: string) {
		setItems((prev) => applySkip(prev, itemId));
	}

	function handleUnskip(itemId: string) {
		setItems((prev) => applyUnskip(prev, itemId));
	}

	async function handleCreateSupplement(name: string): Promise<string | null> {
		const result = await addSupplement({
			name,
			category: "supplement",
			stockUnit: "capsule",
		});
		if (result?.data?.supplementId) {
			const newId = result.data.supplementId;
			setLocalSupplements((prev) => [...prev, { id: newId, name }]);
			return newId;
		}
		toast.error("Nie udało się utworzyć suplementu.");
		return null;
	}

	const unverifiedCount = getUnverifiedCount(items);
	const canSave = canSaveCart(items, selectedShopId, shopName);

	async function handleSave() {
		if (!canSave) return;

		setIsSaving(true);

		try {
			let shopId = selectedShopId;

			if (shopName.trim() && !shopId) {
				const deliveryCost = shopDeliveryCost ? parseFloat(shopDeliveryCost) : undefined;
				const freeDeliveryThreshold = shopFreeThreshold ? parseFloat(shopFreeThreshold) : undefined;
				const result = await createShop({
					name: shopName.trim(),
					...(deliveryCost && deliveryCost > 0 ? { deliveryCost } : {}),
					...(freeDeliveryThreshold && freeDeliveryThreshold > 0 ? { freeDeliveryThreshold } : {}),
				});
				if (result?.data?.shop) {
					shopId = result.data.shop.id;
				}
			}

			const updates = buildPriceUpdates(items, shopId);

			if (updates.length > 0) {
				await updateSupplementPrices({ updates });
			}

			if (loadedScanId) {
				await deleteCartScan({ scanId: loadedScanId });
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
		isSaving,
		error,
		items,
		localSupplements,
		handleCreateSupplement,
		detectedShopName,
		shopName,
		setShopName,
		selectedShopId,
		setSelectedShopId,
		shopDeliveryCost,
		setShopDeliveryCost,
		shopFreeThreshold,
		setShopFreeThreshold,
		unverifiedCount,
		canSave,
		closeSheet,
		loadScan,
		handleFileUpload,
		handleMatchChange,
		handlePriceChange,
		handleVerify,
		handleSkip,
		handleUnskip,
		handleSave,
		CART_CONFIDENCE_THRESHOLD,
	};
}
