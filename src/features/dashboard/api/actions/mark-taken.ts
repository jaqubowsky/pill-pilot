"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isCooldownActive } from "@/features/dashboard/lib/cooldown";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { dailyLogRepository } from "@/shared/repositories/daily-log-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleId: z.string(),
	date: z.iso.date(),
	skipTimer: z.boolean().optional(),
});

async function enforceCooldown(protocolId: string, supplementId: string, date: string) {
	const siblings = await supplementScheduleRepository.findSiblings(protocolId, supplementId);
	const first = siblings[0];
	if (!first?.dosageIntervalMinutes) return;

	const ids = siblings.map((s) => s.id);
	const siblingLogs = await dailyLogRepository.findByDateAndScheduleIds(date, ids);
	if (siblingLogs.length === 0) return;

	if (isCooldownActive(siblingLogs, first.dosageIntervalMinutes, Date.now())) {
		throw new ActionError(ActionErrorCode.COOLDOWN_ACTIVE);
	}
}
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

		if (schedule.finishPackage) {
			const updated = await supplementRepository.findById(schedule.supplementId);

			if (updated && updated.currentStock !== null && parseFloat(updated.currentStock) <= 0) {
				await supplementScheduleRepository.deactivateFinishPackageBySupplementId(
					schedule.supplementId,
				);
			}
		}

		revalidatePath("/dashboard");

		return { logId: log.id };
	});
