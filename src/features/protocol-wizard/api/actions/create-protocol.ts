"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";
import {
	buildScheduleDataList,
	resolveSupplements,
} from "@/features/protocol-wizard/lib/resolve-supplements";
import {
	CONFIDENCE_THRESHOLD,
	parsedProtocolSchema,
} from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { ProtocolStatus } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const createProtocolSchema = z.object({
	protocolId: z.string(),
	parsedData: z.string(),
	startDate: z.iso.date(),
});

export const createProtocol = authActionClient
	.inputSchema(createProtocolSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { userId } = ctx;
		const { protocolId, parsedData, startDate } = parsedInput;

		await protocolRepository.findByIdAndUserId(protocolId, userId);

		const parsed = parsedProtocolSchema.parse(JSON.parse(parsedData));

		const unverified = parsed.supplements.filter((s) => s.confidence < CONFIDENCE_THRESHOLD);
		if (unverified.length > 0) {
			returnValidationErrors(createProtocolSchema, {
				_errors: ["unverified_supplements"],
			});
		}

		const resolvedSupplements = await resolveSupplements(parsed.supplements, userId);
		const userTimeBlocks = await timeBlockRepository.findByUserId(userId);
		const validTimeBlockIds = new Set(userTimeBlocks.map((tb) => tb.id));
		const schedules = buildScheduleDataList(
			parsed.supplements,
			resolvedSupplements,
			protocolId,
			validTimeBlockIds,
		);

		for (const schedule of schedules) {
			await supplementScheduleRepository.create(schedule);
		}

		await protocolRepository.update(protocolId, {
			status: ProtocolStatus.active,
			startDate,
		});

		const newSupplementIds = resolvedSupplements.filter((s) => s.isNew).map((s) => s.supplementId);

		return { newSupplementIds };
	});
