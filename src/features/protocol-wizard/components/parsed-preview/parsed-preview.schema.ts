import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";

export const editedScheduleSchema = z.object({
	dosageAmount: z.number().positive(),
	dosageUnit: z.enum(DOSAGE_UNITS),
	timeBlockId: z.string().min(1),
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

export const editedProtocolSchema = z.object({
	protocolName: z.string().min(1),
	supplements: z.array(editedSupplementSchema),
});

export type EditedProtocol = z.infer<typeof editedProtocolSchema>;
export type EditedSupplement = z.infer<typeof editedSupplementSchema>;
