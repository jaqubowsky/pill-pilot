"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	supplementId: z.string().min(1),
	amount: z.number().positive(),
	packagePrice: z.number().positive().optional(),
});

export const replenishStock = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await supplementRepository.findByIdAndUserId(parsedInput.supplementId, ctx.userId);

		await supplementRepository.incrementStock(
			parsedInput.supplementId,
			parsedInput.amount.toString(),
		);

		if (parsedInput.packagePrice !== undefined) {
			await supplementRepository.update(parsedInput.supplementId, {
				packagePrice: parsedInput.packagePrice.toString(),
			});
		}

		revalidatePath("/stock");
	});
