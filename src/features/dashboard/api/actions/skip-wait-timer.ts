"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";

const schema = z.object({
	logId: z.string(),
});

export const skipWaitTimer = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { logId }, ctx }) => {
		await dailyLogRepository.findOwnedById(logId, ctx.userId);
		await dailyLogRepository.updateById(logId, { timerNotifiedAt: new Date() });

		revalidatePath("/dashboard");
	});
