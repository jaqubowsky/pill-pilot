"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { shopRepository } from "@/shared/repositories/shop-repository";

const createShopSchema = z.object({
	name: z.string().min(1),
	deliveryCost: z.number().nonnegative().optional(),
	freeDeliveryThreshold: z.number().nonnegative().optional(),
});

const updateShopSchema = z.object({
	shopId: z.string().min(1),
	name: z.string().min(1),
	deliveryCost: z.number().nonnegative().optional().nullable(),
	freeDeliveryThreshold: z.number().nonnegative().optional().nullable(),
});

const deleteShopSchema = z.object({
	shopId: z.string().min(1),
});

export const createShop = authActionClient
	.inputSchema(createShopSchema)
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

export const updateShop = authActionClient
	.inputSchema(updateShopSchema)
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

export const deleteShop = authActionClient
	.inputSchema(deleteShopSchema)
	.action(async ({ parsedInput, ctx }) => {
		await shopRepository.findByIdAndUserId(parsedInput.shopId, ctx.userId);
		await shopRepository.delete(parsedInput.shopId);

		revalidatePath("/shopping");
		revalidatePath("/stock");
	});
