"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const timeBlockToCreateSchema = z.object({
	tempId: z.string(),
	name: z.string(),
	icon: z.string(),
	startTime: z.string(),
});

const schema = z.object({
	shareToken: z.string(),
	name: z.string().min(1),
	parsedData: z.string(),
	timeBlocksToCreate: z.array(timeBlockToCreateSchema),
});

export const importSharedProtocol = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx: { userId } }) => {
		const { shareToken, name, parsedData, timeBlocksToCreate } = parsedInput;

		const sharedProtocol = await protocolRepository.findByShareToken(shareToken);
		if (!sharedProtocol) {
			throw new ActionError(ActionErrorCode.PROTOCOL_NOT_FOUND);
		}

		const tempToReal = new Map<string, string>();
		for (const tb of timeBlocksToCreate) {
			const created = await timeBlockRepository.create({
				userId,
				name: tb.name,
				icon: tb.icon,
				startTime: tb.startTime,
			});
			tempToReal.set(tb.tempId, created.id);
		}

		let finalParsedData = parsedData;
		if (tempToReal.size > 0) {
			const parsed = JSON.parse(parsedData) as {
				supplements: Array<{ schedules: Array<{ timeBlockId: string }> }>;
			};
			for (const supplement of parsed.supplements) {
				for (const schedule of supplement.schedules) {
					const realId = tempToReal.get(schedule.timeBlockId);
					if (realId) {
						schedule.timeBlockId = realId;
					}
				}
			}
			finalParsedData = JSON.stringify(parsed);
		}

		const protocol = await protocolRepository.create({
			userId,
			name,
			parsedData: finalParsedData,
			status: "draft",
		});

		revalidatePath("/settings");
		return { protocolId: protocol.id };
	});
