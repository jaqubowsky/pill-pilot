"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { dailyLogs } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";

const schema = z.object({
	logId: z.string(),
	adjustmentMinutes: z.number(),
});

export const adjustTimer = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { logId, adjustmentMinutes } }) => {
		const rows = await db.select().from(dailyLogs).where(eq(dailyLogs.id, logId));
		const log = rows[0];
		if (!log) return;

		const current = log.timerAdjustmentMinutes ?? 0;
		await db
			.update(dailyLogs)
			.set({ timerAdjustmentMinutes: current + adjustmentMinutes })
			.where(eq(dailyLogs.id, logId));

		revalidatePath("/dashboard");
	});
