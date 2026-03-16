import { z } from "zod";

export const cartItemSchema = z.object({
	productName: z.string(),
	price: z.number(),
	quantity: z.number().nullable().optional(),
	matchedSupplementId: z.string().nullable().optional(),
	confidence: z.number(),
});

export const cartParseSchema = z.object({
	items: z.array(cartItemSchema),
	shopName: z.string().nullable().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
