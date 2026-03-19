"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createShop } from "@/features/shopping/api/actions/create-shop";
import { deleteShop } from "@/features/shopping/api/actions/delete-shop";
import { updateShop } from "@/features/shopping/api/actions/update-shop";
import type { ShopWithDelivery } from "@/shared/api/queries/get-price-list";
import { type ShopFormValues, shopFormSchema } from "./shop-edit-sheet.schema";

type UseShopEditSheetParams = {
	shop: ShopWithDelivery | null;
	onOpenChange: (open: boolean) => void;
};

function parseOptionalPositiveNumber(value: string): number | null {
	if (!value.trim()) return null;
	const n = parseFloat(value);
	return Number.isNaN(n) || n < 0 ? null : n;
}

export function useShopEditSheet({ shop, onOpenChange }: UseShopEditSheetParams) {
	const isNew = shop === null;
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const methods = useForm<ShopFormValues>({
		resolver: zodResolver(shopFormSchema),
		defaultValues: {
			name: shop?.name ?? "",
			deliveryCost: shop?.deliveryCost ?? "",
			freeDeliveryThreshold: shop?.freeDeliveryThreshold ?? "",
		},
	});

	useEffect(() => {
		methods.reset({
			name: shop?.name ?? "",
			deliveryCost: shop?.deliveryCost ?? "",
			freeDeliveryThreshold: shop?.freeDeliveryThreshold ?? "",
		});
	}, [shop, methods]);

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

	const handleSubmit = methods.handleSubmit((values) => {
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
	});

	function handleDeleteConfirm() {
		if (!shop) return;
		executeDelete({ shopId: shop.id });
	}

	return {
		methods,
		isNew,
		isPending,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		handleSubmit,
		handleDeleteConfirm,
	};
}
