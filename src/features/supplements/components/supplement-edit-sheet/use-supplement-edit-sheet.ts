"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import type { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import { addSupplement } from "../../api/actions/add-supplement";
import { deleteSupplement } from "../../api/actions/delete-supplement";
import { updateSupplement } from "../../api/actions/update-supplement";
import type { SupplementFormValues } from "../supplement-form";

export type SupplementEditData = {
	id: string;
	name: string;
	brandName: string | null;
	shopId: string | null;
	category: SupplementCategory;
	stockUnit: DosageUnit;
	currentStock: string | null;
	packageSize: number | null;
	packagePrice: string | null;
};

type UseSupplementEditSheetParams = {
	supplement: SupplementEditData | null;
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
				shopId: supplement.shopId ?? undefined,
				category: supplement.category,
				stockUnit: supplement.stockUnit,
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
