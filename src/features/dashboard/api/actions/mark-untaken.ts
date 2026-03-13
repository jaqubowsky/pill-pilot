"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleId: z.string(),
	date: z.string(),
});

export const markUntaken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { scheduleId, date } }) => {
		const existing = await dailyLogRepository.findByScheduleAndDate(scheduleId, date);

		if (!existing) {
			return { success: true };
		}

		await dailyLogRepository.deleteByScheduleAndDate(scheduleId, date);

		const schedule = await supplementScheduleRepository.findWithContext(scheduleId);
		if (schedule) {
			await supplementRepository.incrementStock(schedule.supplementId, schedule.dosageAmount);
		}

		revalidatePath("/dashboard");

		return { success: true };
	});
