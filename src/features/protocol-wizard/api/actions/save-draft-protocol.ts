"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const saveDraftProtocolSchema = z.object({
	protocolId: z.string(),
	parsedData: z.string(),
	name: z.string(),
});

export const saveDraftProtocol = authActionClient
	.inputSchema(saveDraftProtocolSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { userId } = ctx;
		const { protocolId, parsedData, name } = parsedInput;

		await protocolRepository.findByIdAndUserId(protocolId, userId);
		const protocol = await protocolRepository.update(protocolId, {
			parsedData,
			name,
		});

		return { protocol };
	});
