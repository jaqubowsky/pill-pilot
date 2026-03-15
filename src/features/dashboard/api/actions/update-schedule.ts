"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolSupplementRepository } from "@/shared/repositories/protocol-supplement-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";

const schema = z.object({
	scheduleId: z.string().min(1),
	name: z.string().min(1),
	brandName: z.string().optional(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	isCritical: z.boolean(),
	notes: z.string().optional(),
	cycleDaysOn: z.number().positive().optional(),
	cycleDaysOff: z.number().positive().optional(),
	startDayOffset: z.number().min(0).optional(),
	durationDays: z.number().positive().optional(),
	dosageIntervalMinutes: z.number().positive().optional(),
	waitAfterTakingMinutes: z.number().positive().optional(),
	dosageAmount: z.number().positive(),
	dosageUnit: z.enum(DOSAGE_UNITS),
	timeBlockId: z.string().min(1),
});

export const updateSchedule = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		const schedule = await supplementScheduleRepository.findOwnedWithContext(
			parsedInput.scheduleId,
			ctx.userId,
		);

		await supplementRepository.update(schedule.supplementId, {
			name: parsedInput.name,
			brandName: parsedInput.brandName || null,
			category: parsedInput.category,
		});

		await protocolSupplementRepository.update(schedule.protocolSupplementId, {
			notes: parsedInput.notes || null,
			isCritical: parsedInput.isCritical,
			cycleDaysOn: parsedInput.cycleDaysOn ?? null,
			cycleDaysOff: parsedInput.cycleDaysOff ?? null,
			startDayOffset: parsedInput.startDayOffset ?? 0,
			durationDays: parsedInput.durationDays ?? null,
			dosageIntervalMinutes: parsedInput.dosageIntervalMinutes ?? null,
			waitAfterTakingMinutes: parsedInput.waitAfterTakingMinutes ?? null,
		});

		await supplementScheduleRepository.update(schedule.id, {
			dosageAmount: String(parsedInput.dosageAmount),
			dosageUnit: parsedInput.dosageUnit,
			timeBlockId: parsedInput.timeBlockId,
		});

		revalidatePath("/dashboard");
		revalidatePath("/settings");
	});
