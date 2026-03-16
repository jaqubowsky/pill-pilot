"use client";

import { FormProvider, type SubmitHandler } from "react-hook-form";
import { SupplementFields } from "./supplement-fields";
import type { SupplementFormValues } from "./supplement-form.schema";
import { useSupplementForm } from "./use-supplement-form";

type ShopOption = {
	id: string;
	name: string;
};

type SupplementFormProps = {
	defaultValues?: Partial<SupplementFormValues>;
	onSubmit: SubmitHandler<SupplementFormValues>;
	formId: string;
	supplementId?: string;
	shops?: ShopOption[];
};

export function SupplementForm({
	defaultValues,
	onSubmit,
	formId,
	supplementId,
	shops,
}: SupplementFormProps) {
	const { methods, handleSubmit } = useSupplementForm({ defaultValues, onSubmit });

	return (
		<FormProvider {...methods}>
			<form id={formId} onSubmit={handleSubmit}>
				<SupplementFields supplementId={supplementId} shops={shops} />
			</form>
		</FormProvider>
	);
}
