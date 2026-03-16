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
		}

		for (const update of parsedInput.updates) {
			const patch: Record<string, unknown> = {};
			if (update.packagePrice !== undefined) {
				patch.packagePrice = update.packagePrice.toString();
			}
			if (update.packageSize !== undefined) {
				patch.packageSize = update.packageSize;
			}
			if ("shopId" in update) {
				patch.shopId = update.shopId ?? null;
			}
			if (Object.keys(patch).length > 0) {
				await supplementRepository.update(update.supplementId, patch);
			}
		}

		revalidatePath("/shopping");
		revalidatePath("/stock");
	});
