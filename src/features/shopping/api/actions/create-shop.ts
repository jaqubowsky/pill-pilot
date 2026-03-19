"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { shopRepository } from "@/shared/repositories/shop-repository";

const schema = z.object({
	name: z.string().min(1),
	deliveryCost: z.number().nonnegative().optional(),
	freeDeliveryThreshold: z.number().nonnegative().optional(),
});

export const createShop = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		const shop = await shopRepository.create({
			userId: ctx.userId,
			name: parsedInput.name,
			deliveryCost: parsedInput.deliveryCost?.toString() ?? null,
			freeDeliveryThreshold: parsedInput.freeDeliveryThreshold?.toString() ?? null,
		});

		revalidatePath("/shopping");
		revalidatePath("/stock");

		return { shop };
	});
