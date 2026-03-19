"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { replenishStock } from "@/features/stock/api/actions/replenish-stock";

const restockSchema = z.object({
	amount: z.number().positive(),
	packagePrice: z.number().positive().optional(),
});

type RestockValues = z.infer<typeof restockSchema>;

type UseRestockFormParams = {
	supplementId: string;
	onClose: () => void;
};

export function useRestockForm({ supplementId, onClose }: UseRestockFormParams) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { isValid },
	} = useForm<RestockValues>({
		resolver: zodResolver(restockSchema),
		mode: "onChange",
	});

	const { execute, isPending } = useAction(replenishStock, {
		onSuccess: () => {
			reset();
			onClose();
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	function onSubmit(values: RestockValues) {
		execute({
			supplementId,
			amount: values.amount,
			packagePrice: values.packagePrice,
		});
	}

	return { register, handleSubmit: handleSubmit(onSubmit), isValid, isPending };
}
