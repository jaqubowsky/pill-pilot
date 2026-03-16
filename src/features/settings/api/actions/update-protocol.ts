"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { parsedProtocolSchema } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const updateProtocolSchema = z.object({
	protocolId: z.string(),
	parsedData: z.string(),
	startDate: z.iso.date(),
});

export const updateProtocol = authActionClient
	.inputSchema(updateProtocolSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { userId } = ctx;
		const { protocolId, parsedData, startDate } = parsedInput;

		await protocolRepository.findByIdAndUserId(protocolId, userId);

		const parsed = parsedProtocolSchema.parse(JSON.parse(parsedData));

		await supplementScheduleRepository.deleteByProtocolId(protocolId);

		const userTimeBlocks = await timeBlockRepository.findByUserId(userId);
		const validTimeBlockIds = new Set(userTimeBlocks.map((tb) => tb.id));

		const supplementIdMap: Record<string, string> = {};

		for (const item of parsed.supplements) {
			if (item.existingSupplementId) {
				await supplementRepository.findByIdAndUserId(item.existingSupplementId, userId);
				supplementIdMap[item.name] = item.existingSupplementId;
			} else {
				const created = await supplementRepository.create({
					userId,
					name: item.name,
					brandName: item.brandName ?? null,
					category: item.category,
				});
				supplementIdMap[item.name] = created.id;
			}
		}

		let sortOrder = 0;
		for (const item of parsed.supplements) {
			const supplementId = supplementIdMap[item.name];

			for (const schedule of item.schedules) {
				if (!validTimeBlockIds.has(schedule.timeBlockId)) {
					throw new ActionError(ActionErrorCode.TIME_BLOCK_NOT_FOUND);
				}

				const cycleDaysOn = schedule.cycleDaysOn ?? item.cycleDaysOn ?? null;
				const cycleDaysOff = schedule.cycleDaysOff ?? item.cycleDaysOff ?? null;
				const hasCycling = cycleDaysOn !== null && cycleDaysOff !== null;

				await supplementScheduleRepository.create({
					protocolId,
					supplementId,
					timeBlockId: schedule.timeBlockId,
					dosageAmount: String(schedule.dosageAmount),
					dosageUnit: schedule.dosageUnit,
					notes: schedule.notes ?? item.notes ?? null,
					isCritical: schedule.isCritical ?? item.isCritical,
					sortOrder: sortOrder++,
					startDayOffset: schedule.startDayOffset ?? item.startDayOffset ?? 0,
					durationDays: schedule.durationDays ?? item.durationDays ?? null,
					dosageIntervalMinutes: item.dosageIntervalMinutes ?? null,
					waitAfterTakingMinutes:
						schedule.waitAfterTakingMinutes ?? item.waitAfterTakingMinutes ?? null,
					...(hasCycling ? { cycleDaysOn, cycleDaysOff } : {}),
				});
			}
		}

		await protocolRepository.update(protocolId, {
			name: parsed.protocolName,
			parsedData,
			startDate,
		});

		redirect("/settings");
	});
