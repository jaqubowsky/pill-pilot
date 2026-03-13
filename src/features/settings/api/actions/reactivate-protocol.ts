"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProtocolStatus } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { protocolSupplementRepository } from "@/shared/repositories/protocol-supplement-repository";

const schema = z.object({
	protocolId: z.string(),
});

export const reactivateProtocol = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		await protocolRepository.findByIdAndUserId(protocolId, userId);

		await protocolRepository.updateStatus(protocolId, ProtocolStatus.active);
		await protocolSupplementRepository.reactivateByProtocolId(protocolId);

		revalidatePath("/settings");
		revalidatePath("/dashboard");
	});
