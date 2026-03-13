"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleIds: z.array(z.string()),
	date: z.string(),
});

export const markBlockTaken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { scheduleIds, date } }) => {
		const existing = await dailyLogRepository.findByDateAndScheduleIds(date, scheduleIds);
		const existingIds = new Set(existing.map((l) => l.scheduleId));
		const uncheckedIds = scheduleIds.filter((id) => !existingIds.has(id));

		for (const scheduleId of uncheckedIds) {
			const schedule = await supplementScheduleRepository.findWithContext(scheduleId);
			if (schedule) {
				const supplement = await supplementRepository.findById(schedule.supplementId);
				if (
					supplement &&
					supplement.currentStock !== null &&
					parseFloat(supplement.currentStock) <= 0
				) {
					continue;
				}
			}

			await dailyLogRepository.create({
				scheduleId,
				date,
				takenAt: new Date(),
			});

			if (schedule) {
				await supplementRepository.decrementStock(schedule.supplementId, schedule.dosageAmount);
			}
		}

		revalidatePath("/dashboard");

		return { checkedCount: uncheckedIds.length };
	});
