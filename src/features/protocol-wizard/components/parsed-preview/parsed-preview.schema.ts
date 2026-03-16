import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";

const editedScheduleSchema = z.object({
	dosageAmount: z.number().positive(),
	dosageUnit: z.enum(DOSAGE_UNITS),
	timeBlockId: z.string().min(1),
	notes: z.string().nullable().optional(),
	waitAfterTakingMinutes: z.number().positive().nullable().optional(),
	isCritical: z.boolean().optional(),
	cycleDaysOn: z.number().nullable().optional(),
	cycleDaysOff: z.number().nullable().optional(),
	startDayOffset: z.number().min(0).optional(),
	durationDays: z.number().positive().nullable().optional(),
	finishPackage: z.boolean().optional(),
});

export const editedSupplementSchema = z.object({
	name: z.string().min(1),
	existingSupplementId: z.string().nullable(),
	brandName: z.string().nullable(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	isCritical: z.boolean(),
	notes: z.string().nullable(),
	cycleDaysOn: z.number().nullable(),
	cycleDaysOff: z.number().nullable(),
	startDayOffset: z.number().min(0),
	durationDays: z.number().positive().nullable(),
	dosageIntervalMinutes: z.number().positive().nullable(),
	waitAfterTakingMinutes: z.number().positive().nullable(),
	confidence: z.number().min(0).max(1),
	uncertaintyReason: z.string().nullable(),
	schedules: z.array(editedScheduleSchema),
});

export type EditedSupplement = z.infer<typeof editedSupplementSchema>;
