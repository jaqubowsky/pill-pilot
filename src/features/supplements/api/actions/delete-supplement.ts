"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	supplementId: z.string().min(1),
});

export const deleteSupplement = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await supplementRepository.findByIdAndUserId(parsedInput.supplementId, ctx.userId);

		await supplementScheduleRepository.deactivateBySupplementId(parsedInput.supplementId);
		await supplementRepository.softDelete(parsedInput.supplementId);

		revalidatePath("/stock");
		revalidatePath("/dashboard");
		revalidatePath("/settings");
	});
