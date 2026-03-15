"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleId: z.string(),
	date: z.iso.date(),
});

export const markTaken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { scheduleId, date }, ctx }) => {
		const existing = await dailyLogRepository.findByScheduleAndDate(scheduleId, date);

		if (existing) {
			return { logId: existing.id };
		}

		const schedule = await supplementScheduleRepository.findOwnedWithContext(
			scheduleId,
			ctx.userId,
		);

		const supplement = await supplementRepository.findByIdAndUserId(
			schedule.supplementId,
			ctx.userId,
		);
		if (supplement.currentStock !== null && parseFloat(supplement.currentStock) <= 0) {
			throw new ActionError(ActionErrorCode.OUT_OF_STOCK);
		}

		const log = await dailyLogRepository.create({
			scheduleId,
			date,
			takenAt: new Date(),
		});

		await supplementRepository.decrementStock(schedule.supplementId, schedule.dosageAmount);

		revalidatePath("/dashboard");

		return { logId: log.id };
	});
