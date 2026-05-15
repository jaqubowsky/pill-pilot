import { generateText, Output } from "ai";
import { z } from "zod";
import type { ExistingSupplementSummary } from "@/features/protocol-wizard/types";
import { anthropic } from "@/shared/lib/ai";

const matchSchema = z.object({
	matches: z.array(
		z.object({
			index: z.number(),
			existingSupplementId: z.string().nullable(),
		}),
	),
});

export async function matchShareSupplements(
	sharedNames: string[],
	existing: ExistingSupplementSummary[],
): Promise<Array<string | null>> {
	if (sharedNames.length === 0) return [];
	if (existing.length === 0) return sharedNames.map(() => null);

	const { output } = await generateText({
		model: anthropic("claude-haiku-4-5"),
		output: Output.object({ schema: matchSchema }),
		messages: [
			{
				role: "user",
				content: `Match these shared protocol supplements to the user's existing supplements.
Return existingSupplementId for strong matches (confidence ≥ 0.9), or null for no match.

Shared supplements (0-indexed):
${sharedNames.map((n, i) => `${i}: "${n}"`).join("\n")}

User's existing supplements:
${existing.map((s) => `id: "${s.id}", name: "${s.name}"${s.brandName ? `, brand: "${s.brandName}"` : ""}`).join("\n")}`,
			},
		],
	});

	const map = new Map(output?.matches.map((m) => [m.index, m.existingSupplementId]) ?? []);
	return sharedNames.map((_, i) => map.get(i) ?? null);
}
