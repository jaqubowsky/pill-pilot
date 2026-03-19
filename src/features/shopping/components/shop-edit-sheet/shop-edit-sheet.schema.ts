import { z } from "zod";

export const shopFormSchema = z.object({
	name: z.string().min(1),
	deliveryCost: z.string(),
	freeDeliveryThreshold: z.string(),
});

export type ShopFormValues = z.infer<typeof shopFormSchema>;
