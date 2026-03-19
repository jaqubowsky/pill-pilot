"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	updates: z
		.array(
			z.object({
				supplementId: z.string().min(1),
				packagePrice: z.number().positive().optional(),
				packageSize: z.number().positive().int().optional(),
				shopId: z.string().optional().nullable(),
			}),
		)
		.min(1),
});

export const updateSupplementPrices = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		for (const update of parsedInput.updates) {
			await supplementRepository.findByIdAndUserId(update.supplementId, ctx.userId);

			await supplementRepository.update(update.supplementId, {
				...(update.packagePrice !== undefined && { packagePrice: update.packagePrice.toString() }),
				...(update.packageSize !== undefined && { packageSize: update.packageSize }),
				...("shopId" in update && { shopId: update.shopId ?? null }),
			});
		}

		revalidatePath("/shopping");
		revalidatePath("/stock");
	});
