"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProtocolStatus } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	protocolId: z.string(),
});

export const archiveProtocol = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		await protocolRepository.findByIdAndUserId(protocolId, userId);

		await supplementScheduleRepository.deactivateByProtocolId(protocolId);
		await protocolRepository.updateStatus(protocolId, ProtocolStatus.archived);

		revalidatePath("/settings");
		revalidatePath("/dashboard");
	});
