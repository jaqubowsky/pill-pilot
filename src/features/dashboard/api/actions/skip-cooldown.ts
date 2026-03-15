"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { dailyLogs, protocolSupplements, protocols, supplementSchedules } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";

const schema = z.object({
	protocolSupplementId: z.string(),
	date: z.iso.date(),
});

export const skipCooldown = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolSupplementId, date }, ctx }) => {
		await db
			.select({ id: protocolSupplements.id })
			.from(protocolSupplements)
			.innerJoin(protocols, eq(protocolSupplements.protocolId, protocols.id))
			.where(
				and(eq(protocolSupplements.id, protocolSupplementId), eq(protocols.userId, ctx.userId)),
			);

		const siblingSchedules = await db
			.select({ id: supplementSchedules.id })
			.from(supplementSchedules)
			.where(eq(supplementSchedules.protocolSupplementId, protocolSupplementId));

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
