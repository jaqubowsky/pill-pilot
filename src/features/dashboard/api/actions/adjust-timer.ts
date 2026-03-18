"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";

const schema = z.object({
	logId: z.string(),
	adjustmentMinutes: z.number(),
});

export const adjustTimer = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { logId, adjustmentMinutes }, ctx }) => {
		const log = await dailyLogRepository.findOwnedById(logId, ctx.userId);

		const current = log.timerAdjustmentMinutes ?? 0;
		await dailyLogRepository.updateById(logId, {
			timerAdjustmentMinutes: current + adjustmentMinutes,
		});

		revalidatePath("/dashboard");
	});
