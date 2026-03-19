import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { sendPushNotification } from "@/features/settings/lib/web-push";
import { db } from "@/shared/db/client";
import {
	notificationSettings,
	protocols,
	pushSubscriptions,
	supplementSchedules,
	timeBlocks,
} from "@/shared/db/schema";
import { toDateString, toTimeString } from "@/shared/lib/date";

type SendResult = {
	sent: number;
	failed: number;
	matched: number;
	skipped: number;
};

export async function sendScheduledNotifications(): Promise<SendResult> {
	const t = await getTranslations("settings.notifications");
	const now = new Date();
	const currentTime = toTimeString(now);
	const today = toDateString(now);

	const pending = await db
		.select({
			id: notificationSettings.id,
			userId: notificationSettings.userId,
			timeBlockId: notificationSettings.timeBlockId,
			timeBlockName: timeBlocks.name,
			notifyAt: notificationSettings.notifyAt,
		})
		.from(notificationSettings)
		.innerJoin(timeBlocks, eq(notificationSettings.timeBlockId, timeBlocks.id))
		.where(
			and(
				eq(notificationSettings.enabled, true),
				lte(notificationSettings.notifyAt, currentTime),
				sql`(${notificationSettings.lastSentDate} IS NULL OR ${notificationSettings.lastSentDate} != ${today})`,
			),
		)
		.orderBy(desc(notificationSettings.notifyAt));

	const latestPerUser = new Map<string, (typeof pending)[number]>();
	const staleIds: string[] = [];

	for (const setting of pending) {
		if (!latestPerUser.has(setting.userId)) {
			latestPerUser.set(setting.userId, setting);
		} else {
			staleIds.push(setting.id);
		}
	}

	if (staleIds.length > 0) {
		await db
			.update(notificationSettings)
			.set({ lastSentDate: today })
			.where(inArray(notificationSettings.id, staleIds));
	}

	let sent = 0;
	let failed = 0;
	let skipped = 0;

	for (const setting of latestPerUser.values()) {
		const unchecked = await db
			.select({ id: supplementSchedules.id })
			.from(supplementSchedules)
			.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
			.where(
				and(
					eq(supplementSchedules.timeBlockId, setting.timeBlockId),
					eq(protocols.userId, setting.userId),
					eq(protocols.status, "active"),
					eq(supplementSchedules.active, true),
					sql`NOT EXISTS (
						SELECT 1 FROM daily_logs
						WHERE daily_logs.schedule_id = ${supplementSchedules.id}
						AND daily_logs.date = ${today}
					)`,
				),
			)
			.limit(1);

		if (unchecked.length === 0) {
			skipped++;
			await db
				.update(notificationSettings)
				.set({ lastSentDate: today })
				.where(eq(notificationSettings.id, setting.id));
			continue;
		}

		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(eq(pushSubscriptions.userId, setting.userId));

		let settingSent = false;
		for (const sub of subscriptions) {
			try {
				await sendPushNotification(sub.subscriptionJson, {
					title: "PillPilot",
					body: t("pushTimeBlock", { timeBlockName: setting.timeBlockName }),
				});
				sent++;
				settingSent = true;
			} catch {
				failed++;
			}
		}

		if (settingSent) {
			await db
				.update(notificationSettings)
				.set({ lastSentDate: today })
				.where(eq(notificationSettings.id, setting.id));
		}
	}

	return { sent, failed, matched: latestPerUser.size, skipped };
}
