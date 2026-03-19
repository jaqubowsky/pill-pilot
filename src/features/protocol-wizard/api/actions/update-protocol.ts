"use server";

import { z } from "zod";
import {
	buildScheduleDataList,
	resolveSupplements,
} from "@/features/protocol-wizard/lib/resolve-supplements";
import { parsedProtocolSchema } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
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

		const existingSchedules = await supplementScheduleRepository.findByProtocolId(protocolId);
		const existingMap = new Map(
			existingSchedules.map((s) => [`${s.supplementId}:${s.timeBlockId}`, s]),
		);

		const resolvedSupplements = await resolveSupplements(parsed.supplements, userId);
		const userTimeBlocks = await timeBlockRepository.findByUserId(userId);
		const validTimeBlockIds = new Set(userTimeBlocks.map((tb) => tb.id));
		const schedules = buildScheduleDataList(
			parsed.supplements,
			resolvedSupplements,
			protocolId,
			validTimeBlockIds,
		);

		const matchedKeys = new Set<string>();

		for (const schedule of schedules) {
			const key = `${schedule.supplementId}:${schedule.timeBlockId}`;
			const existing = existingMap.get(key);

			if (existing) {
				matchedKeys.add(key);
				await supplementScheduleRepository.update(existing.id, schedule);
			} else {
				await supplementScheduleRepository.create(schedule);
			}
		}

		for (const schedule of existingSchedules) {
			const key = `${schedule.supplementId}:${schedule.timeBlockId}`;
			if (!matchedKeys.has(key)) {
				await supplementScheduleRepository.deleteById(schedule.id);
			}
		}

		await protocolRepository.update(protocolId, {
			name: parsed.protocolName,
			parsedData,
			startDate,
		});
	});
