import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";

export const previewSupplementSheetSchema = z.object({
	name: z.string().min(1),
	brandName: z.string().optional(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	isCritical: z.boolean(),
	notes: z.string().optional(),
	cycleDaysOn: z.number().positive().optional(),
	cycleDaysOff: z.number().positive().optional(),
	prerequisiteLocalId: z.string().optional(),
	delayDays: z.number().positive().optional(),
	dosageAmount: z.number().positive(),
	dosageUnit: z.enum(DOSAGE_UNITS),
	timeBlockId: z.string().min(1),
});

export type PreviewSupplementSheetValues = z.infer<typeof previewSupplementSheetSchema>;
