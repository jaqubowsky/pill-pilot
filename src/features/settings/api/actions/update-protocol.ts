"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parsedProtocolSchema } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { db } from "@/shared/db/client";
import { protocolSupplements } from "@/shared/db/schema";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { protocolSupplementRepository } from "@/shared/repositories/protocol-supplement-repository";
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

		await db.delete(protocolSupplements).where(eq(protocolSupplements.protocolId, protocolId));

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

			const hasCycling = item.cycleDaysOn !== null && item.cycleDaysOff !== null;
			const cyclingFields = hasCycling
				? {
						cycleDaysOn: item.cycleDaysOn,
						cycleDaysOff: item.cycleDaysOff,
					}
				: {};

			const protocolSupplement = await protocolSupplementRepository.create({
				protocolId,
				supplementId,
				notes: item.notes ?? null,
				isCritical: item.isCritical,
				sortOrder: sortOrder++,
				startDayOffset: item.startDayOffset ?? 0,
				durationDays: item.durationDays ?? null,
				...cyclingFields,
			});

			for (const schedule of item.schedules) {
				if (!validTimeBlockIds.has(schedule.timeBlockId)) {
					throw new ActionError(ActionErrorCode.TIME_BLOCK_NOT_FOUND);
				}
				await supplementScheduleRepository.create({
					protocolSupplementId: protocolSupplement.id,
					timeBlockId: schedule.timeBlockId,
					dosageAmount: String(schedule.dosageAmount),
					dosageUnit: schedule.dosageUnit,
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
