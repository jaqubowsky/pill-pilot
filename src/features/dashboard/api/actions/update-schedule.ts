"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
	buildSyncPayload,
	detectChangedFields,
} from "@/features/dashboard/lib/detect-changed-fields";
import { db } from "@/shared/db/client";
import {
	DOSAGE_UNITS,
	SUPPLEMENT_CATEGORIES,
	supplementSchedules,
	timeBlocks,
} from "@/shared/db/schema";
import { authActionClient } from "@/shared/lib/safe-action";
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
	updateSiblings: z.boolean().optional(),
	changedFields: z.array(z.string()).optional(),
});

type ScheduleRow = typeof supplementSchedules.$inferSelect;

type SharedField = Exclude<
	keyof ScheduleRow,
	| "id"
	| "protocolId"
	| "supplementId"
	| "timeBlockId"
	| "dosageAmount"
	| "dosageUnit"
	| "dosageIntervalMinutes"
	| "sortOrder"
	| "active"
	| "createdAt"
>;

const SHARED_FIELDS: SharedField[] = [
	"isCritical",
	"notes",
	"cycleDaysOn",
	"cycleDaysOff",
	"startDayOffset",
	"durationDays",
	"waitAfterTakingMinutes",
];

export const updateSchedule = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx }) => {
		const schedule = await supplementScheduleRepository.findOwned(
			parsedInput.scheduleId,
			ctx.userId,
		);

		await supplementRepository.update(schedule.supplementId, {
			name: parsedInput.name,
			brandName: parsedInput.brandName || null,
			category: parsedInput.category,
		});

		const sharedData = {
			notes: parsedInput.notes || null,
			isCritical: parsedInput.isCritical,
			cycleDaysOn: parsedInput.cycleDaysOn ?? null,
			cycleDaysOff: parsedInput.cycleDaysOff ?? null,
			startDayOffset: parsedInput.startDayOffset ?? 0,
			durationDays: parsedInput.durationDays ?? null,
			dosageIntervalMinutes: parsedInput.dosageIntervalMinutes ?? null,
			waitAfterTakingMinutes: parsedInput.waitAfterTakingMinutes ?? null,
		};

		await supplementScheduleRepository.update(schedule.id, {
			...sharedData,
			dosageAmount: String(parsedInput.dosageAmount),
			dosageUnit: parsedInput.dosageUnit,
			timeBlockId: parsedInput.timeBlockId,
		});

		if (sharedData.dosageIntervalMinutes !== schedule.dosageIntervalMinutes) {
			await supplementScheduleRepository.updateSiblings(
				schedule.protocolId,
				schedule.supplementId,
				{ dosageIntervalMinutes: sharedData.dosageIntervalMinutes },
			);
		}

		if (parsedInput.updateSiblings && parsedInput.changedFields) {
			const fieldsToSync = buildSyncPayload(parsedInput.changedFields, sharedData);
			if (Object.keys(fieldsToSync).length > 0) {
				await supplementScheduleRepository.updateSiblings(
					schedule.protocolId,
					schedule.supplementId,
					fieldsToSync,
				);
			}
			revalidatePath("/dashboard");
			revalidatePath("/settings");
			return { siblings: null, changedFields: null };
		}

		const changedFields = detectChangedFields(
			Object.fromEntries(SHARED_FIELDS.map((f) => [f, schedule[f]])),
			sharedData,
			SHARED_FIELDS.map((f) => f as string),
		) as SharedField[];

		if (changedFields.length === 0) {
			revalidatePath("/dashboard");
			revalidatePath("/settings");
			return { siblings: null, changedFields: null };
		}

		const siblingRows = await db
			.select({
				scheduleId: supplementSchedules.id,
				timeBlockName: timeBlocks.name,
			})
			.from(supplementSchedules)
			.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
			.where(
				and(
					eq(supplementSchedules.protocolId, schedule.protocolId),
					eq(supplementSchedules.supplementId, schedule.supplementId),
					ne(supplementSchedules.id, schedule.id),
				),
			);

		if (siblingRows.length === 0) {
			revalidatePath("/dashboard");
			revalidatePath("/settings");
			return { siblings: null, changedFields: null };
		}

		return {
			siblings: siblingRows.map((s) => ({
				timeBlockName: s.timeBlockName,
			})),
			changedFields,
		};
	});
