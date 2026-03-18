"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	protocolId: z.string(),
	supplementId: z.string(),
	date: z.iso.date(),
});

export const skipCooldown = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId, supplementId, date }, ctx }) => {
		await protocolRepository.findByIdAndUserId(protocolId, ctx.userId);

		const siblings = await supplementScheduleRepository.findSiblings(protocolId, supplementId);
		const siblingIds = siblings.map((s) => s.id);
		if (siblingIds.length === 0) return;

		const siblingLogs = await dailyLogRepository.findByDateAndScheduleIds(date, siblingIds);
		if (siblingLogs.length === 0) return;

		const mostRecent = siblingLogs.reduce((latest, log) =>
			log.takenAt > latest.takenAt ? log : latest,
		);

		await dailyLogRepository.updateById(mostRecent.id, { cooldownSkippedAt: new Date() });

		revalidatePath("/dashboard");
	});
