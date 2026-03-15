import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	notificationSettings,
	protocolSupplements,
	protocols,
	pushSubscriptions,
	supplementSchedules,
	timeBlocks,
} from "@/shared/db/schema";
import { sendPushNotification } from "@/shared/lib/web-push";

export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
	const today = now.toISOString().slice(0, 10);

	const settings = await db
		.select({
			userId: notificationSettings.userId,
			timeBlockId: notificationSettings.timeBlockId,
			timeBlockName: timeBlocks.name,
		})
		.from(notificationSettings)
		.innerJoin(timeBlocks, eq(notificationSettings.timeBlockId, timeBlocks.id))
		.where(
			and(
				eq(notificationSettings.enabled, true),
				eq(notificationSettings.notifyAt, currentTime),
			),
		);

	let sent = 0;
	let failed = 0;
	let skipped = 0;

	for (const setting of settings) {
		const unchecked = await db
			.select({ id: supplementSchedules.id })
			.from(supplementSchedules)
			.innerJoin(
				protocolSupplements,
				eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
			)
			.innerJoin(protocols, eq(protocolSupplements.protocolId, protocols.id))
			.where(
				and(
					eq(supplementSchedules.timeBlockId, setting.timeBlockId),
					eq(protocols.userId, setting.userId),
					eq(protocols.status, "active"),
					eq(protocolSupplements.active, true),
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
			continue;
		}

		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(eq(pushSubscriptions.userId, setting.userId));

		for (const sub of subscriptions) {
			try {
				await sendPushNotification(sub.subscriptionJson, {
					title: "PillPilot",
					body: `Czas na suplementy: ${setting.timeBlockName}`,
				});
				sent++;
			} catch {
				failed++;
			}
		}
	}

	return NextResponse.json({ sent, failed, matched: settings.length, skipped });
}
