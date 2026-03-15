"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { dailyLogs } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";

const schema = z.object({
	logId: z.string(),
});

export const skipWaitTimer = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { logId } }) => {
		await db.update(dailyLogs).set({ timerNotifiedAt: new Date() }).where(eq(dailyLogs.id, logId));

		revalidatePath("/dashboard");
	});
