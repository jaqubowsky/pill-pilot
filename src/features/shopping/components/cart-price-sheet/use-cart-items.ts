"use client";

import { useState } from "react";
import {
	applyMatch,
	applyPriceChange,
	applySkip,
	applyUnskip,
	applyVerify,
	type CartItemState,
	getUnverifiedCount,
	toCartItemStates,
} from "@/features/shopping/lib/cart-logic";
import type { CartItem } from "@/features/shopping/schemas/cart-parse-schema";

export function useCartItems() {
	const [items, setItems] = useState<CartItemState[]>([]);

	function loadItems(cartItems: CartItem[]) {
		setItems(toCartItemStates(cartItems));
	}

	function clearItems() {
		setItems([]);
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

	return {
		items,
		unverifiedCount: getUnverifiedCount(items),
		loadItems,
		clearItems,
		handleMatchChange,
		handlePriceChange,
		handleVerify,
		handleSkip,
		handleUnskip,
	};
}
