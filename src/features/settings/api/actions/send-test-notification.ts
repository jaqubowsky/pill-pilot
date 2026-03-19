"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { sendPushNotification } from "@/features/settings/lib/web-push";
import { authActionClient } from "@/shared/lib/safe-action";
import { notificationRepository } from "@/shared/repositories/notification-repository";

export const sendTestNotification = authActionClient
	.inputSchema(z.object({}))
	.action(async ({ ctx: { userId } }) => {
		const t = await getTranslations("settings.notifications");
		const subscriptions = await notificationRepository.findByUserId(userId);

		if (subscriptions.length === 0) {
			throw new Error(t("noSubscriptions"));
		}

		const results = await Promise.allSettled(
			subscriptions.map((sub) =>
				sendPushNotification(sub.subscriptionJson, {
					title: "PillPilot",
					body: t("testPushBody"),
				}),
			),
		);

		const sent = results.filter((r) => r.status === "fulfilled").length;

		return { sent };
	});
