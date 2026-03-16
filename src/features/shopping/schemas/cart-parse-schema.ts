import { z } from "zod";

export const cartItemSchema = z.object({
	productName: z.string(),
	price: z.number().nonnegative(),
	quantity: z.number().int().positive().optional(),
	matchedSupplementId: z.string().nullable().optional(),
	confidence: z.number().min(0).max(1),
});

export const cartParseSchema = z.object({
	items: z.array(cartItemSchema),
	shopName: z.string().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type CartParse = z.infer<typeof cartParseSchema>;
