"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { shopRepository } from "@/shared/repositories/shop-repository";

const schema = z.object({
	shopId: z.string().min(1),
	name: z.string().min(1),
	deliveryCost: z.number().nonnegative().optional().nullable(),
	freeDeliveryThreshold: z.number().nonnegative().optional().nullable(),
});

export const updateShop = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await shopRepository.findByIdAndUserId(parsedInput.shopId, ctx.userId);

		const shop = await shopRepository.update(parsedInput.shopId, {
			name: parsedInput.name,
			deliveryCost: parsedInput.deliveryCost != null ? parsedInput.deliveryCost.toString() : null,
			freeDeliveryThreshold:
				parsedInput.freeDeliveryThreshold != null
					? parsedInput.freeDeliveryThreshold.toString()
					: null,
		});

		revalidatePath("/shopping");
		revalidatePath("/stock");

		return { shop };
	});
