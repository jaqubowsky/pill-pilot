"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { dailyLogs, supplementSchedules } from "@/shared/db/schema";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleId: z.string(),
	date: z.iso.date(),
	skipTimer: z.boolean().optional(),
});

export const markTaken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { scheduleId, date, skipTimer }, ctx }) => {
		const existing = await dailyLogRepository.findByScheduleAndDate(scheduleId, date);

		if (existing) {
			return { logId: existing.id };
		}

		const schedule = await supplementScheduleRepository.findOwned(scheduleId, ctx.userId);

		const supplement = await supplementRepository.findByIdAndUserId(
			schedule.supplementId,
			ctx.userId,
		);
		if (supplement.currentStock !== null && parseFloat(supplement.currentStock) <= 0) {
			throw new ActionError(ActionErrorCode.OUT_OF_STOCK);
		}

		await enforceCooldown(schedule.protocolId, schedule.supplementId, date);

		const now = new Date();
		const log = await dailyLogRepository.create({
			scheduleId,
			date,
			takenAt: now,
			...(skipTimer && { timerNotifiedAt: now }),
		});

		await supplementRepository.decrementStock(schedule.supplementId, schedule.dosageAmount);

		revalidatePath("/dashboard");

		return { logId: log.id };
	});

async function enforceCooldown(protocolId: string, supplementId: string, date: string) {
	const [first] = await db
		.select({ dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes })
		.from(supplementSchedules)
		.where(
			and(
				eq(supplementSchedules.protocolId, protocolId),
				eq(supplementSchedules.supplementId, supplementId),
			),
		);

	if (!first?.dosageIntervalMinutes) return;

	const siblingScheduleIds = await db
		.select({ id: supplementSchedules.id })
		.from(supplementSchedules)
		.where(
			and(
				eq(supplementSchedules.protocolId, protocolId),
				eq(supplementSchedules.supplementId, supplementId),
			),
		);

	const ids = siblingScheduleIds.map((s) => s.id);
	if (ids.length === 0) return;

	const siblingLogs = await db
		.select({
			takenAt: dailyLogs.takenAt,
			timerAdjustmentMinutes: dailyLogs.timerAdjustmentMinutes,
			cooldownSkippedAt: dailyLogs.cooldownSkippedAt,
		})
		.from(dailyLogs)
		.where(and(eq(dailyLogs.date, date), inArray(dailyLogs.scheduleId, ids)));

	if (siblingLogs.length === 0) return;

	const mostRecent = siblingLogs.reduce((latest, log) =>
		log.takenAt > latest.takenAt ? log : latest,
	);

	if (mostRecent.cooldownSkippedAt) return;

	const intervalMs = first.dosageIntervalMinutes * 60 * 1000;
	const adjustmentMs = (mostRecent.timerAdjustmentMinutes ?? 0) * 60 * 1000;
	const expiresAt = mostRecent.takenAt.getTime() + intervalMs + adjustmentMs;

	if (expiresAt > Date.now()) {
		throw new ActionError(ActionErrorCode.COOLDOWN_ACTIVE);
	}
}
