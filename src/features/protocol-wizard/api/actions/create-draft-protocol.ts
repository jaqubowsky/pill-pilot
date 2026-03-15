"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const createDraftProtocolSchema = z.object({
	name: z.string().min(1),
	parsedData: z.string(),
});

export const createDraftProtocol = authActionClient
	.inputSchema(createDraftProtocolSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { userId } = ctx;
		const { name, parsedData } = parsedInput;

		const protocol = await protocolRepository.create({
			userId,
			name,
			parsedData,
			status: "draft",
		});

		return { protocol };
	});
