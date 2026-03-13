import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";

export const parsedScheduleSchema = z.object({
	dosageAmount: z.number().describe("Dosage amount, must be positive"),
	dosageUnit: z.enum(DOSAGE_UNITS),
	timeBlockId: z.string(),
});

export const parsedSupplementSchema = z.object({
	name: z.string(),
	existingSupplementId: z.string().nullable(),
	brandName: z.string().nullable(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	isCritical: z.boolean(),
	notes: z
		.string()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"Notes about this supplement in Polish (e.g. '30 min przed jedzeniem', 'z posiłkiem')",
		),
	cycleDaysOn: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe("Number of days to take the supplement (cycling pattern)"),
	cycleDaysOff: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe("Number of days to pause the supplement (cycling pattern)"),
	prerequisiteName: z
		.string()
		.nullable()
		.optional()
		.default(null)
		.describe("Name of another supplement in this protocol that must be taken first"),
	delayDays: z
		.number()
		.positive()
		.nullable()
		.optional()
		.default(null)
		.describe("Number of days the prerequisite must be taken before starting this supplement"),
	confidence: z.number().describe("Confidence score between 0.0 and 1.0"),
	schedules: z.array(parsedScheduleSchema),
});

export const parsedProtocolSchema = z.object({
	protocolName: z.string(),
	supplements: z.array(parsedSupplementSchema),
});

export type ParsedProtocol = z.infer<typeof parsedProtocolSchema>;
export type ParsedSupplement = z.infer<typeof parsedSupplementSchema>;
export type ParsedSchedule = z.infer<typeof parsedScheduleSchema>;
