import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	protocolSupplements,
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
			dosageIntervalMinutes: protocolSupplements.dosageIntervalMinutes,
			waitAfterTakingMinutes: protocolSupplements.waitAfterTakingMinutes,
			supplementName: supplements.name,
			userId: protocols.userId,
		})
		.from(dailyLogs)
		.innerJoin(supplementSchedules, eq(dailyLogs.scheduleId, supplementSchedules.id))
		.innerJoin(
			protocolSupplements,
			eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
		)
		.innerJoin(supplements, eq(protocolSupplements.supplementId, supplements.id))
		.innerJoin(protocols, eq(protocolSupplements.protocolId, protocols.id))
		.where(
			and(
				eq(dailyLogs.date, today),
				isNull(dailyLogs.timerNotifiedAt),
				sql`(${protocolSupplements.dosageIntervalMinutes} IS NOT NULL OR ${protocolSupplements.waitAfterTakingMinutes} IS NOT NULL)`,
			),
		);

	let sent = 0;
	let skipped = 0;

	for (const log of timedLogs) {
		const adjustmentMs = (log.timerAdjustmentMinutes ?? 0) * 60 * 1000;
		const takenAtMs = log.takenAt.getTime();

		let expired = false;
		let body = "";

		if (log.dosageIntervalMinutes) {
			const intervalMs = log.dosageIntervalMinutes * 60 * 1000;
			if (takenAtMs + intervalMs + adjustmentMs <= nowMs) {
				expired = true;
				body = `Możesz wziąć następną dawkę: ${log.supplementName}`;
			}
		}

		if (!expired && log.waitAfterTakingMinutes) {
			const waitMs = log.waitAfterTakingMinutes * 60 * 1000;
			if (takenAtMs + waitMs + adjustmentMs <= nowMs) {
				expired = true;
				body = `${log.supplementName} — czas oczekiwania minął`;
			}
		}

		if (!expired) {
			skipped++;
			continue;
		}

		await db.update(dailyLogs).set({ timerNotifiedAt: now }).where(eq(dailyLogs.id, log.logId));

		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(eq(pushSubscriptions.userId, log.userId));

		for (const sub of subscriptions) {
			try {
				await sendPushNotification(sub.subscriptionJson, {
					title: "PillPilot",
					body,
				});
				sent++;
			} catch {}
		}
	}

	return NextResponse.json({ sent, skipped, checked: timedLogs.length });
}
