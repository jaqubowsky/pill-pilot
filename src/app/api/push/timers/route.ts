import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	protocols,
	pushSubscriptions,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";
import { sendPushNotification } from "@/shared/lib/web-push";

export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

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

		let expiresAtMs: number | null = null;
		let type: "interval" | "wait" | null = null;

		if (log.dosageIntervalMinutes) {
			const intervalMs = log.dosageIntervalMinutes * 60 * 1000;
			expiresAtMs = takenAtMs + intervalMs + adjustmentMs;
			if (expiresAtMs <= nowMs) {
				type = "interval";
			}
		}

		if (!type && log.waitAfterTakingMinutes) {
			const waitMs = log.waitAfterTakingMinutes * 60 * 1000;
			expiresAtMs = takenAtMs + waitMs + adjustmentMs;
			if (expiresAtMs <= nowMs) {
				type = "wait";
			}
		}

		if (!type || expiresAtMs === null) {
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
			.where(and(eq(dailyLogs.date, today), sql`${dailyLogs.id} IN ${logIds}`));

		const lines: string[] = [];
		if (interval.length > 0) {
			lines.push(`Następna dawka: ${interval.join(", ")}`);
		}
		if (wait.length > 0) {
			lines.push(`Czas oczekiwania minął: ${wait.join(", ")}`);
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

	return NextResponse.json({ sent, skipped, checked: timedLogs.length });
}
