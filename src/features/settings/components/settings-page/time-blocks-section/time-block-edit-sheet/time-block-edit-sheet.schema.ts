import { z } from "zod";

export const timeBlockFormSchema = z.object({
	name: z.string().min(1),
	icon: z.string().min(1),
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export type TimeBlockFormValues = z.infer<typeof timeBlockFormSchema>;
