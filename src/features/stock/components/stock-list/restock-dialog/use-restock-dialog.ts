"use client";

import { useAction } from "next-safe-action/hooks";
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
	const inputRef = useRef<HTMLInputElement>(null);

	const { execute, isPending } = useAction(replenishStock, {
		onSuccess: () => {
			setAmount("");
			onOpenChange(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [open]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsed = parseFloat(amount);
		if (!Number.isNaN(parsed) && parsed > 0) {
			execute({ supplementId, amount: parsed });
		}
	}

	return {
		amount,
		setAmount,
		inputRef,
		isPending,
		handleSubmit,
	};
}
