"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateStock } from "@/features/stock/api/actions/update-stock";

type UseAdjustDialogParams = {
	supplementId: string;
	currentStock: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function useAdjustDialog({
	supplementId,
	currentStock,
	open,
	onOpenChange,
}: UseAdjustDialogParams) {
	const [value, setValue] = useState(currentStock ?? "");
	const inputRef = useRef<HTMLInputElement>(null);

	const { execute, isPending } = useAction(updateStock, {
		onSuccess: () => {
			onOpenChange(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	useEffect(() => {
		if (open) {
			setValue(currentStock ?? "");
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [open, currentStock]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsed = parseFloat(value);
		if (!Number.isNaN(parsed) && parsed >= 0) {
			execute({ supplementId, newValue: parsed });
		}
	}

	return {
		value,
		setValue,
		inputRef,
		isPending,
		handleSubmit,
	};
}
