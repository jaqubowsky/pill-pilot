"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const schema = z.object({
	protocolId: z.string(),
});

export const deleteDraftProtocol = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		await protocolRepository.findByIdAndUserId(protocolId, userId);
		await protocolRepository.delete(protocolId);

		revalidatePath("/protocol/new");
		revalidatePath("/dashboard");
	});
