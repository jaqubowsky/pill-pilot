"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { sendPushNotification } from "@/shared/lib/web-push";
import { notificationRepository } from "@/shared/repositories/notification-repository";

export const sendTestNotification = authActionClient
	.inputSchema(z.object({}))
	.action(async ({ ctx: { userId } }) => {
		const subscriptions = await notificationRepository.findByUserId(userId);

		if (subscriptions.length === 0) {
			return { sent: 0 };
		}

		let sent = 0;
		for (const sub of subscriptions) {
			try {
				await sendPushNotification(sub.subscriptionJson, {
					title: "PillPilot",
					body: "Powiadomienia testowe dziala!",
				});
				sent++;
			} catch {}
		}

		return { sent };
	});
