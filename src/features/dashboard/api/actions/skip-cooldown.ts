"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { dailyLogs, protocols, supplementSchedules } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";

const schema = z.object({
	protocolId: z.string(),
	supplementId: z.string(),
	date: z.iso.date(),
});

export const skipCooldown = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId, supplementId, date }, ctx }) => {
		await db
			.select({ id: protocols.id })
			.from(protocols)
			.where(and(eq(protocols.id, protocolId), eq(protocols.userId, ctx.userId)));

		const siblingSchedules = await db
			.select({ id: supplementSchedules.id })
			.from(supplementSchedules)
			.where(
				and(
					eq(supplementSchedules.protocolId, protocolId),
					eq(supplementSchedules.supplementId, supplementId),
				),
			);

		const siblingIds = siblingSchedules.map((s) => s.id);
		if (siblingIds.length === 0) return;

		const siblingLogs = await db
			.select({ id: dailyLogs.id, takenAt: dailyLogs.takenAt })
			.from(dailyLogs)
			.where(and(eq(dailyLogs.date, date), inArray(dailyLogs.scheduleId, siblingIds)));

		if (siblingLogs.length === 0) return;

		const mostRecent = siblingLogs.reduce((latest, log) =>
			log.takenAt > latest.takenAt ? log : latest,
		);

		await db
			.update(dailyLogs)
			.set({ cooldownSkippedAt: new Date() })
			.where(eq(dailyLogs.id, mostRecent.id));

		revalidatePath("/dashboard");
	});
