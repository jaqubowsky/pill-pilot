"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import { type SupplementFormValues, supplementFormSchema } from "./supplement-form.schema";

type UseSupplementFormProps = {
	defaultValues?: Partial<SupplementFormValues>;
	onSubmit: (values: SupplementFormValues) => void;
};

export function useSupplementForm({ defaultValues, onSubmit }: UseSupplementFormProps) {
	const methods = useForm<SupplementFormValues>({
		resolver: zodResolver(supplementFormSchema),
		defaultValues: {
			name: "",
			brandName: "",
			category: SupplementCategory.supplement,
			stockUnit: DosageUnit.capsule,
			...defaultValues,
		},
	});

	return {
		methods,
		handleSubmit: methods.handleSubmit(onSubmit),
	};
}
