"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { authActionClient } from "@/shared/lib/safe-action";
import { db } from "@/shared/db/client";
import { notificationSettings } from "@/shared/db/schema";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const schema = z.object({
	timeBlockId: z.string(),
	name: z.string().min(1),
	icon: z.string().min(1),
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
	syncNotification: z.boolean().default(false),
});

export const updateTimeBlock = authActionClient
	.inputSchema(schema)
	.action(
		async ({
			parsedInput: { timeBlockId, name, icon, startTime, syncNotification },
			ctx: { userId },
		}) => {
			await timeBlockRepository.findByIdAndUserId(timeBlockId, userId);

			await timeBlockRepository.update(timeBlockId, { name, icon, startTime });

			if (syncNotification) {
				await db
					.update(notificationSettings)
					.set({ notifyAt: startTime, lastSentDate: null })
					.where(
						and(
							eq(notificationSettings.timeBlockId, timeBlockId),
							eq(notificationSettings.userId, userId),
						),
					);
			}

			revalidatePath("/settings");
			revalidatePath("/dashboard");
		},
	);
