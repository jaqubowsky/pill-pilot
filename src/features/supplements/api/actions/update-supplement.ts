"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES, supplementSchedules } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	supplementId: z.string().min(1),
	name: z.string().min(1),
	brandName: z.string().optional(),
	shopId: z.string().optional(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	stockUnit: z.enum(DOSAGE_UNITS),
	currentStock: z.number().nonnegative().optional(),
	packageSize: z.number().positive().optional(),
	packagePrice: z.number().positive().optional(),
});

export const updateSupplement = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		const existing = await supplementRepository.findByIdAndUserId(
			parsedInput.supplementId,
			ctx.userId,
		);

		await supplementRepository.update(parsedInput.supplementId, {
			name: parsedInput.name,
			brandName: parsedInput.brandName ?? null,
			shopId: parsedInput.shopId ?? null,
			category: parsedInput.category,
			stockUnit: parsedInput.stockUnit,
			currentStock: parsedInput.currentStock?.toString() ?? null,
			packageSize: parsedInput.packageSize ?? null,
			packagePrice: parsedInput.packagePrice?.toString() ?? null,
		});

		if (existing.stockUnit !== parsedInput.stockUnit) {
			await db
				.update(supplementSchedules)
				.set({ dosageUnit: parsedInput.stockUnit })
				.where(eq(supplementSchedules.supplementId, parsedInput.supplementId));
		}

		revalidatePath("/stock");
		revalidatePath("/dashboard");
		revalidatePath("/settings");
		revalidatePath("/shopping");
	});
