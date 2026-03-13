"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const schema = z.object({
	timeBlockId: z.string(),
	name: z.string().min(1),
	icon: z.string().min(1),
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const updateTimeBlock = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { timeBlockId, name, icon, startTime }, ctx: { userId } }) => {
		await timeBlockRepository.findByIdAndUserId(timeBlockId, userId);

		await timeBlockRepository.update(timeBlockId, { name, icon, startTime });

		revalidatePath("/settings");
		revalidatePath("/dashboard");
	});
