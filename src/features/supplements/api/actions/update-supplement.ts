"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	supplementId: z.string().min(1),
	name: z.string().min(1),
	brandName: z.string().optional(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	currentStock: z.number().nonnegative().optional(),
	packageSize: z.number().positive().optional(),
	packagePrice: z.number().positive().optional(),
});

export const updateSupplement = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await supplementRepository.findByIdAndUserId(parsedInput.supplementId, ctx.userId);

		await supplementRepository.update(parsedInput.supplementId, {
			name: parsedInput.name,
			brandName: parsedInput.brandName ?? null,
			category: parsedInput.category,
			currentStock: parsedInput.currentStock?.toString() ?? null,
			packageSize: parsedInput.packageSize ?? null,
			packagePrice: parsedInput.packagePrice?.toString() ?? null,
		});

		revalidatePath("/stock");
		revalidatePath("/settings");
	});
