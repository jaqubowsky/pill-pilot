"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import type { StockListItem } from "@/features/stock/api/queries/get-stock-list";
import {
	addSupplement,
	deleteSupplement,
	type SupplementFormValues,
	updateSupplement,
} from "@/features/supplements";

type UseSupplementEditSheetParams = {
	supplement: StockListItem | null;
	onOpenChange: (open: boolean) => void;
};

export function useSupplementEditSheet({ supplement, onOpenChange }: UseSupplementEditSheetParams) {
	const isNew = supplement === null;
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const { execute: executeAdd, isPending: isAdding } = useAction(addSupplement, {
		onSuccess: () => onOpenChange(false),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: executeUpdate, isPending: isUpdating } = useAction(updateSupplement, {
		onSuccess: () => onOpenChange(false),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: executeDelete, isPending: isDeleting } = useAction(deleteSupplement, {
		onSuccess: () => onOpenChange(false),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const isPending = isAdding || isUpdating || isDeleting;

	function handleSubmit(values: SupplementFormValues) {
		if (isNew) {
			executeAdd(values);
		} else {
			executeUpdate({
				supplementId: supplement.id,
				...values,
			});
		}
	}

	function handleDeleteConfirm() {
		if (!supplement) return;
		executeDelete({ supplementId: supplement.id });
	}

	const defaultValues: Partial<SupplementFormValues> | undefined = supplement
		? {
				name: supplement.name,
				brandName: supplement.brandName ?? undefined,
				category: supplement.category as SupplementFormValues["category"],
				stockUnit: supplement.stockUnit as SupplementFormValues["stockUnit"],
				currentStock: supplement.currentStock ? parseFloat(supplement.currentStock) : undefined,
				packageSize: supplement.packageSize ?? undefined,
				packagePrice: supplement.packagePrice ? parseFloat(supplement.packagePrice) : undefined,
			}
		: undefined;

	return {
		isNew,
		isPending,
		handleSubmit,
		handleDeleteConfirm,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		defaultValues,
	};
}
