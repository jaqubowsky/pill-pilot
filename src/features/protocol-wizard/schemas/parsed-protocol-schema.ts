import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";

export const CONFIDENCE_THRESHOLD = 0.9;

const rawExtractionItemSchema = z.object({
	name: z.string(),
	rawDosage: z.string(),
	rawTiming: z.string(),
	rawNotes: z.string().nullable(),
	rawCategory: z.string(),
	rawCycling: z.string().nullable(),
	rawDependency: z.string().nullable(),
	rawInterval: z.string().nullable(),
	rawWaitAfter: z.string().nullable(),
	isMedication: z.boolean(),
});

export const rawExtractionSchema = z.object({
	protocolName: z.string(),
	items: z.array(rawExtractionItemSchema),
});

const parsedScheduleSchema = z.object({
	dosageAmount: z.number().describe("Dosage amount, must be positive"),
	dosageUnit: z.enum(DOSAGE_UNITS),
	timeBlockId: z.string(),
	notes: z
		.string()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"Per-schedule notes in Polish (e.g. '30 min przed jedzeniem', 'z posiłkiem'). Use when the same supplement has different instructions per time block.",
		),
	waitAfterTakingMinutes: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"Minutes to wait after taking before eating. Per-schedule override. null if no wait requirement.",
		),
	isCritical: z
		.boolean()
		.optional()
		.default(false)
		.describe("Per-schedule critical flag. true when skipping would have health consequences."),
	cycleDaysOn: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe("Per-schedule cycling: days on. null if no cycling."),
	cycleDaysOff: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe("Per-schedule cycling: days off. null if no cycling."),
	startDayOffset: z
		.number()
		.optional()
		.default(0)
		.describe("Per-schedule day offset from protocol start. 0 = starts immediately."),
	durationDays: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe("Per-schedule duration in days. null = indefinitely."),
	finishPackage: z
		.boolean()
		.optional()
		.default(false)
		.describe("Per-schedule flag to finish current package instead of fixed duration."),
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
	startDayOffset: z
		.number()
		.optional()
		.default(0)
		.describe(
			"Day offset from protocol start date when this supplement becomes active. 0 = starts immediately. E.g. 14 for supplements that start 2 weeks after protocol begins.",
		),
	durationDays: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"How many days to take this supplement. null = indefinitely/permanently ('Stale'). E.g. 14 for '14 dni', 90 for '3 msc'. Derived from 'Okres' column.",
		),
	dosageIntervalMinutes: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"Minimum minutes between doses. ONLY for hard medical requirements (antibiotics, strict dosing). E.g. 'co 6 godzin' → 360, 'co 8h' → 480. Do NOT derive from frequency like '3x dziennie'. null if no explicit interval.",
		),
	waitAfterTakingMinutes: z
		.number()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"Minutes to wait after taking before eating. E.g. '30 min przed jedzeniem' → 30, 'na czczo 45 min' → 45. null if no wait requirement.",
		),
	confidence: z.number().describe("Confidence score between 0.0 and 1.0"),
	uncertaintyReason: z
		.string()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"When confidence < 0.9, explain in Polish why (e.g. 'Dawka nieczytelna', 'Nazwa niejednoznaczna')",
		),
	schedules: z.array(parsedScheduleSchema),
	_removed: z.boolean().optional(),
});

export const parsedProtocolSchema = z.object({
	protocolName: z.string().max(200),
	supplements: z.array(parsedSupplementSchema),
});

export type ParsedProtocol = z.infer<typeof parsedProtocolSchema>;
export type ParsedSupplement = z.infer<typeof parsedSupplementSchema>;
