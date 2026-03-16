"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createShop, deleteShop, updateShop } from "@/features/shopping/api/actions/manage-shop";
import type { ShopOption } from "@/features/shopping/api/queries/get-price-list";

type UseShopEditSheetParams = {
	shop: ShopOption | null;
	onOpenChange: (open: boolean) => void;
};

type ShopFormValues = {
	name: string;
	deliveryCost: string;
	freeDeliveryThreshold: string;
};

export function useShopEditSheet({ shop, onOpenChange }: UseShopEditSheetParams) {
	const isNew = shop === null;
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const [values, setValues] = useState<ShopFormValues>({
		name: shop?.name ?? "",
		deliveryCost: shop?.deliveryCost ?? "",
		freeDeliveryThreshold: shop?.freeDeliveryThreshold ?? "",
	});

	useEffect(() => {
		setValues({
			name: shop?.name ?? "",
			deliveryCost: shop?.deliveryCost ?? "",
			freeDeliveryThreshold: shop?.freeDeliveryThreshold ?? "",
		});
	}, [shop]);

	const { execute: executeCreate, isPending: isCreating } = useAction(createShop, {
		onSuccess: () => onOpenChange(false),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: executeUpdate, isPending: isUpdating } = useAction(updateShop, {
		onSuccess: () => onOpenChange(false),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: executeDelete, isPending: isDeleting } = useAction(deleteShop, {
		onSuccess: () => onOpenChange(false),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const isPending = isCreating || isUpdating || isDeleting;

	function parseOptionalPositiveNumber(value: string): number | null {
		if (!value.trim()) return null;
		const n = parseFloat(value);
		return Number.isNaN(n) || n < 0 ? null : n;
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!values.name.trim()) return;

		const deliveryCost = parseOptionalPositiveNumber(values.deliveryCost);
		const freeDeliveryThreshold = parseOptionalPositiveNumber(values.freeDeliveryThreshold);

		if (isNew) {
			executeCreate({
				name: values.name.trim(),
				...(deliveryCost !== null && { deliveryCost }),
				...(freeDeliveryThreshold !== null && { freeDeliveryThreshold }),
			});
		} else {
			executeUpdate({
				shopId: shop.id,
				name: values.name.trim(),
				deliveryCost,
				freeDeliveryThreshold,
			});
		}
	}

	function handleDeleteConfirm() {
		if (!shop) return;
		executeDelete({ shopId: shop.id });
	}

	return {
		isNew,
		isPending,
		values,
		setValues,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		handleSubmit,
		handleDeleteConfirm,
	};
}
