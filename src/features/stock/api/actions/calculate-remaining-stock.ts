"use server";

import { z } from "zod";
import { getActiveSchedulesForSupplement } from "@/features/stock/api/queries/get-active-schedules-for-supplement";
import { toDateString } from "@/shared/lib/date";
import { authActionClient } from "@/shared/lib/safe-action";
import { calculateConsumedUnits } from "@/shared/lib/stock-forecast";
import { supplementRepository } from "@/shared/repositories/supplement-repository";

const schema = z.object({
	supplementId: z.string().min(1),
	packageSize: z.number().positive(),
	daysAgo: z.number().int().min(1).max(365),
});

export const calculateRemainingStock = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		await supplementRepository.findByIdAndUserId(parsedInput.supplementId, ctx.userId);

		const schedules = await getActiveSchedulesForSupplement(parsedInput.supplementId);

		const today = toDateString(new Date());
		const consumed = calculateConsumedUnits(schedules, parsedInput.daysAgo, today);
		const remaining = Math.max(0, Math.round(parsedInput.packageSize - consumed));

		return { consumed: Math.round(consumed), remaining };
	});
