import { z } from "zod";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";

export const supplementFormSchema = z.object({
	name: z.string().min(1),
	brandName: z.string().optional(),
	shopId: z.string().optional(),
	category: z.enum(SUPPLEMENT_CATEGORIES),
	stockUnit: z.enum(DOSAGE_UNITS),
	currentStock: z.number().nonnegative().optional(),
	packageSize: z.number().positive().optional(),
	packagePrice: z.number().positive().optional(),
});

export type SupplementFormValues = z.infer<typeof supplementFormSchema>;
