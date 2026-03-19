import { z } from "zod";

export const supplementContextSchema = z.object({
	id: z.string().max(128),
	name: z.string().max(200),
	brandName: z.string().max(200).nullable().optional(),
});

type SupplementContext = z.infer<typeof supplementContextSchema>;

export function buildCartParsePrompt(supplements: SupplementContext[]): string {
	const supplementList = supplements
		.map((s) => `- id: ${s.id}, name: ${s.name}${s.brandName ? `, brand: ${s.brandName}` : ""}`)
		.join("\n");

	return `You are a shopping cart parser. The user uploaded a screenshot of an online shop cart. Extract all products with prices.

<user_supplements>
${supplementList || "(none)"}
</user_supplements>

<instructions>
- Extract every product line from the cart.
- productName: product name as shown in the cart.
- price: price per unit as a number (e.g. 29.99). Use the unit price, not the line total if quantity > 1.
- quantity: quantity in cart if visible. null if not shown.
- matchedSupplementId: if the product clearly matches one of the user's supplements above, set this to the supplement's id. null if no match.
- confidence: 0.0–1.0 confidence that matchedSupplementId is correct. 0 if matchedSupplementId is null.
- shopName: detect the shop name from the screenshot (logo, URL, header). null if not visible.

Match conservatively — only match when product name clearly corresponds to the supplement name. When in doubt, set matchedSupplementId to null and confidence to 0.
</instructions>

Return ONLY the structured JSON. No prose.`;
}
