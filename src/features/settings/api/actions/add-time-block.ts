"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const schema = z.object({
	name: z.string().min(1),
	icon: z.string().min(1),
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const addTimeBlock = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { name, icon, startTime }, ctx: { userId } }) => {
		await timeBlockRepository.create({
			userId,
			name,
			icon,
			startTime,
		});

		revalidatePath("/settings");
		revalidatePath("/dashboard");
	});
