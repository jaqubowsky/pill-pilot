"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleIds: z.array(z.string()).max(50),
	date: z.iso.date(),
});

export const markBlockTaken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { scheduleIds, date }, ctx }) => {
		const existing = await dailyLogRepository.findByDateAndScheduleIds(date, scheduleIds);

		const existingIds = new Set(existing.map((l) => l.scheduleId));
		const uncheckedIds = scheduleIds.filter((id) => !existingIds.has(id));

		let checkedCount = 0;

		for (const scheduleId of uncheckedIds) {
			const schedule = await supplementScheduleRepository.findOwned(scheduleId, ctx.userId);

			const supplement = await supplementRepository.findByIdAndUserId(
				schedule.supplementId,
				ctx.userId,
			);
			if (supplement.currentStock !== null && parseFloat(supplement.currentStock) <= 0) {
				continue;
			}

			await dailyLogRepository.create({
				scheduleId,
				date,
				takenAt: new Date(),
			});

			await supplementRepository.decrementStock(schedule.supplementId, schedule.dosageAmount);
			checkedCount++;
		}

		revalidatePath("/dashboard");

		return { checkedCount };
	});
