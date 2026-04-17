"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export const revokeShareToken = authActionClient
	.inputSchema(z.object({ protocolId: z.string() }))
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		await protocolRepository.findByIdAndUserId(protocolId, userId);
		await protocolRepository.update(protocolId, { shareToken: null });
		revalidatePath("/settings");
	});
