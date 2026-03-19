"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supplementFormSchema } from "@/features/supplements/components/supplement-form/supplement-form.schema";
import { db } from "@/shared/db/client";
import { supplementSchedules } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = supplementFormSchema.extend({
	supplementId: z.string().min(1),
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
