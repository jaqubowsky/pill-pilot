"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolSupplementRepository } from "@/shared/repositories/protocol-supplement-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	supplementId: z.string().min(1),
});

export const deleteSupplement = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await supplementRepository.findByIdAndUserId(parsedInput.supplementId, ctx.userId);

		await protocolSupplementRepository.deactivateBySupplementId(parsedInput.supplementId);
		await supplementRepository.softDelete(parsedInput.supplementId);

		revalidatePath("/stock");
		revalidatePath("/dashboard");
		revalidatePath("/settings");
	});
