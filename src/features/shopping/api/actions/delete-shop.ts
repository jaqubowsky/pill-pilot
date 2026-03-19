"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { shopRepository } from "@/shared/repositories/shop-repository";

const schema = z.object({
	shopId: z.string().min(1),
});

export const deleteShop = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await shopRepository.findByIdAndUserId(parsedInput.shopId, ctx.userId);
		await shopRepository.delete(parsedInput.shopId);

		revalidatePath("/shopping");
		revalidatePath("/stock");
	});
