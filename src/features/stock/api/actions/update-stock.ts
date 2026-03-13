"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	supplementId: z.string().min(1),
	newValue: z.number().min(0),
});

export const updateStock = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await supplementRepository.findByIdAndUserId(parsedInput.supplementId, ctx.userId);

		await supplementRepository.updateStock(
			parsedInput.supplementId,
			parsedInput.newValue.toString(),
		);

		revalidatePath("/stock");
	});
