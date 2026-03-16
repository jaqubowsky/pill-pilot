"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { ProtocolStatus, protocols, supplementSchedules } from "@/shared/db/schema";
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

		const scheduleRows = await db
			.select({
				dosageAmount: supplementSchedules.dosageAmount,
				cycleDaysOn: supplementSchedules.cycleDaysOn,
				cycleDaysOff: supplementSchedules.cycleDaysOff,
				startDayOffset: supplementSchedules.startDayOffset,
				durationDays: supplementSchedules.durationDays,
				protocolStartDate: protocols.startDate,
			})
			.from(supplementSchedules)
			.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
			.where(
				and(
					eq(supplementSchedules.supplementId, parsedInput.supplementId),
					eq(supplementSchedules.active, true),
					eq(protocols.status, ProtocolStatus.active),
				),
			);

		const today = toDateString(new Date());
		const effectiveStart = toDateString(new Date(Date.now() - parsedInput.daysAgo * 86_400_000));

		const consumed = calculateConsumedUnits(
			scheduleRows.map((s) => ({
				dosageAmount: parseFloat(s.dosageAmount),
				cycleDaysOn: s.cycleDaysOn,
				cycleDaysOff: s.cycleDaysOff,
				startDayOffset: s.startDayOffset,
				durationDays: s.durationDays,
				protocolStartDate: effectiveStart,
			})),
			parsedInput.daysAgo,
			today,
		);

		const remaining = Math.max(0, Math.round(parsedInput.packageSize - consumed));

		return { consumed: Math.round(consumed), remaining };
	});
