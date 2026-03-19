import { and, eq, inArray, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { sendPushNotification } from "@/features/settings/lib/web-push";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	protocols,
	pushSubscriptions,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";

type TimerResult = {
	sent: number;
	skipped: number;
	checked: number;
};

export async function sendTimerNotifications(): Promise<TimerResult> {
	const t = await getTranslations("settings.notifications");
	const now = new Date();
	const today = toDateString(now);
	const nowMs = now.getTime();

	const timedLogs = await db
		.select({
			logId: dailyLogs.id,
			takenAt: dailyLogs.takenAt,
			timerAdjustmentMinutes: dailyLogs.timerAdjustmentMinutes,
			timerNotifiedAt: dailyLogs.timerNotifiedAt,
			dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes,
			waitAfterTakingMinutes: supplementSchedules.waitAfterTakingMinutes,
			supplementName: supplements.name,
			userId: protocols.userId,
		})
		.from(dailyLogs)
		.innerJoin(supplementSchedules, eq(dailyLogs.scheduleId, supplementSchedules.id))
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.where(
			and(
				eq(dailyLogs.date, today),
				isNull(dailyLogs.timerNotifiedAt),
				sql`(${supplementSchedules.dosageIntervalMinutes} IS NOT NULL OR ${supplementSchedules.waitAfterTakingMinutes} IS NOT NULL)`,
			),
		);

	let skipped = 0;

	const userNotifications = new Map<
		string,
		{ interval: string[]; wait: string[]; logIds: string[] }
	>();

	for (const log of timedLogs) {
		const adjustmentMs = (log.timerAdjustmentMinutes ?? 0) * 60 * 1000;
		const takenAtMs = log.takenAt.getTime();

		let type: "interval" | "wait" | null = null;

		if (log.dosageIntervalMinutes) {
			const expiresAtMs = takenAtMs + log.dosageIntervalMinutes * 60 * 1000 + adjustmentMs;
			if (expiresAtMs <= nowMs) type = "interval";
		}

		if (!type && log.waitAfterTakingMinutes) {
			const expiresAtMs = takenAtMs + log.waitAfterTakingMinutes * 60 * 1000 + adjustmentMs;
			if (expiresAtMs <= nowMs) type = "wait";
		}

		if (!type) {
			skipped++;
			continue;
		}

		const entry = userNotifications.get(log.userId) ?? {
			interval: [],
			wait: [],
			logIds: [],
		};
		entry[type].push(log.supplementName);
		entry.logIds.push(log.logId);
		userNotifications.set(log.userId, entry);
	}

	let sent = 0;

	for (const [userId, { interval, wait, logIds }] of userNotifications) {
		await db
			.update(dailyLogs)
			.set({ timerNotifiedAt: now })
			.where(and(eq(dailyLogs.date, today), inArray(dailyLogs.id, logIds)));

		const lines: string[] = [];
		if (interval.length > 0) {
			lines.push(t("pushNextDose", { supplements: interval.join(", ") }));
		}
		if (wait.length > 0) {
			lines.push(t("pushWaitOver", { supplements: wait.join(", ") }));
		}

		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(eq(pushSubscriptions.userId, userId));

		for (const sub of subscriptions) {
			try {
				await sendPushNotification(sub.subscriptionJson, {
					title: "PillPilot",
					body: lines.join("\n"),
				});
				sent++;
			} catch {}
		}
	}

	return { sent, skipped, checked: timedLogs.length };
}
