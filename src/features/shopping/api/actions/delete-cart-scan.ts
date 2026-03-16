"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { cartScans } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";

const deleteCartScanSchema = z.object({
	scanId: z.string().min(1),
});

export const deleteCartScan = authActionClient
	.inputSchema(deleteCartScanSchema)
	.action(async ({ parsedInput, ctx }) => {
		await db
			.delete(cartScans)
			.where(and(eq(cartScans.id, parsedInput.scanId), eq(cartScans.userId, ctx.userId)));
		revalidatePath("/shopping");
	});
