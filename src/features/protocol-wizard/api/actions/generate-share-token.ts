"use server";

import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const schema = z.object({ protocolId: z.string() });

export const generateShareToken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		const protocol = await protocolRepository.findByIdAndUserId(protocolId, userId);

		if (protocol.status !== "active") {
			throw new ActionError(ActionErrorCode.PROTOCOL_NOT_FOUND);
		}

		const shareToken = createId();
		await protocolRepository.update(protocolId, { shareToken });
		revalidatePath("/settings");

		return { shareToken };
	});
