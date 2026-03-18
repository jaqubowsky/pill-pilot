"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { notificationRepository } from "@/shared/repositories/notification-repository";

const schema = z.object({
	settings: z.array(
		z.object({
			timeBlockId: z.string().min(1),
			enabled: z.boolean(),
			notifyAt: z.string().regex(/^\d{2}:\d{2}$/),
		}),
	),
});

export const updateNotificationSettings = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { settings }, ctx: { userId } }) => {
		await notificationRepository.upsertSettings(userId, settings);
		revalidatePath("/settings");
	});
