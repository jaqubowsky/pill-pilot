import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cartParseSchema } from "@/features/shopping/schemas/cart-parse-schema";
import { db } from "@/shared/db/client";
import { cartScans } from "@/shared/db/schema";
import { anthropic } from "@/shared/lib/ai";
import { buildCartParsePrompt } from "./build-cart-prompt";

type SupplementContext = {
	id: string;
	name: string;
	brandName?: string | null;
};

export async function runCartParsePipeline(
	scanId: string,
	compressedData: Buffer,
	supplements: SupplementContext[],
): Promise<void> {
	try {
		const { output } = await generateText({
			model: anthropic("claude-haiku-4-5"),
			output: Output.object({ schema: cartParseSchema }),
			system: buildCartParsePrompt(supplements),
			messages: [
				{
					role: "user",
					content: [
						{ type: "image", image: compressedData },
						{
							type: "text",
							text: "Extract all products and prices from this shopping cart screenshot.",
						},
					],
				},
			],
		});

		if (!output) {
			await db.update(cartScans).set({ status: "failed" }).where(eq(cartScans.id, scanId));
			revalidatePath("/shopping");
			return;
		}

		await db
			.update(cartScans)
			.set({
				status: "completed",
				shopName: output.shopName ?? null,
				items: output.items,
			})
			.where(eq(cartScans.id, scanId));
		revalidatePath("/shopping");
	} catch (e) {
		console.error("[cart/parse] AI error:", e);
		await db.update(cartScans).set({ status: "failed" }).where(eq(cartScans.id, scanId));
		revalidatePath("/shopping");
	}
}
