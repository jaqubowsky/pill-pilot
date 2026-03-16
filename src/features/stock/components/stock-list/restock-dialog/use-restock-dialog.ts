"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { replenishStock } from "@/features/stock/api/actions/replenish-stock";

type UseRestockDialogParams = {
	supplementId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function useRestockDialog({ supplementId, open, onOpenChange }: UseRestockDialogParams) {
	const [amount, setAmount] = useState("");
	const [price, setPrice] = useState("");
	const [isPending, setIsPending] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [open]);

	function resetForm() {
		setAmount("");
		setPrice("");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsedAmount = parseFloat(amount);
		if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

		const parsedPrice = price !== "" ? parseFloat(price) : undefined;
		const packagePrice =
			parsedPrice !== undefined && !Number.isNaN(parsedPrice) && parsedPrice > 0
				? parsedPrice
				: undefined;

		setIsPending(true);
		try {
			const result = await replenishStock({ supplementId, amount: parsedAmount, packagePrice });
			if (result?.serverError) {
				toast.error(result.serverError);
			} else {
				resetForm();
				onOpenChange(false);
			}
		} finally {
			setIsPending(false);
		}
	}

	return {
		amount,
		setAmount,
		price,
		setPrice,
		inputRef,
		isPending,
		handleSubmit,
	};
}
