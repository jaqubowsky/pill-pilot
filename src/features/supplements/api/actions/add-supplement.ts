"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	name: z.string().min(1),
	brandName: z.string().optional(),
	shopId: z.string().optional(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	stockUnit: z.enum(DOSAGE_UNITS),
	currentStock: z.number().nonnegative().optional(),
	packageSize: z.number().positive().optional(),
	packagePrice: z.number().positive().optional(),
});

export const addSupplement = authActionClient
	.inputSchema(schema)
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
