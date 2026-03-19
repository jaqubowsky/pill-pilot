"use server";

import { revalidatePath } from "next/cache";
import { supplementFormSchema } from "@/features/supplements/components/supplement-form/supplement-form.schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

export const addSupplement = authActionClient
	.inputSchema(supplementFormSchema)
	.action(async ({ parsedInput, ctx }) => {
		const supplement = await supplementRepository.create({
			userId: ctx.userId,
			name: parsedInput.name,
			brandName: parsedInput.brandName ?? null,
			shopId: parsedInput.shopId ?? null,
			category: parsedInput.category,
			stockUnit: parsedInput.stockUnit,
			currentStock: parsedInput.currentStock?.toString() ?? null,
			packageSize: parsedInput.packageSize ?? null,
			packagePrice: parsedInput.packagePrice?.toString() ?? null,
			active: true,
		});

		revalidatePath("/stock");
		return { supplementId: supplement.id };
	});
