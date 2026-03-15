"use server";

import { z } from "zod";
import { ProtocolStatus } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const saveDraftProtocolSchema = z.object({
	protocolId: z.string().optional(),
	parsedData: z.string(),
	name: z.string(),
});

export const saveDraftProtocol = authActionClient
	.inputSchema(saveDraftProtocolSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { userId } = ctx;
		const { protocolId, parsedData, name } = parsedInput;

		if (protocolId) {
			await protocolRepository.findByIdAndUserId(protocolId, userId);
			const protocol = await protocolRepository.update(protocolId, {
				parsedData,
				name,
			});
			return { protocol };
		}

		const existing = await protocolRepository.findDraftByUserId(userId);
		if (existing) {
			const protocol = await protocolRepository.update(existing.id, {
				parsedData,
				name,
			});
			return { protocol };
		}

		const protocol = await protocolRepository.create({
			userId,
			name,
			parsedData,
			status: ProtocolStatus.draft,
		});

		return { protocol };
	});
