import { generateObject } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { cartParseSchema } from "@/features/shopping/schemas/cart-parse-schema";
import { anthropic } from "@/shared/lib/ai";
import { auth } from "@/shared/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(userId);

	if (!entry || now > entry.resetAt) {
		rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}

	entry.count++;
	return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isImage(file: File) {
	return IMAGE_TYPES.includes(file.type);
}

async function compressImage(buffer: Buffer): Promise<Buffer> {
	if (buffer.byteLength <= MAX_IMAGE_BYTES) {
		return buffer;
	}

	const image = sharp(buffer);
	const meta = await image.metadata();
	const maxDim = 2048;

	let pipeline = image;
	if (meta.width && meta.height && (meta.width > maxDim || meta.height > maxDim)) {
		pipeline = pipeline.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true });
	}

	const compressed = await pipeline.jpeg({ quality: 80 }).toBuffer();
	if (compressed.byteLength <= MAX_IMAGE_BYTES) {
		return compressed;
	}

	return sharp(buffer)
		.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
		.jpeg({ quality: 50 })
		.toBuffer();
}

const supplementContextSchema = z.object({
	id: z.string().max(128),
	name: z.string().max(200),
	brandName: z.string().max(200).nullable().optional(),
});

function buildPrompt(supplements: z.infer<typeof supplementContextSchema>[]): string {
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

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = session.user.id;

	if (isRateLimited(userId)) {
		return Response.json({ error: "rate_limited" }, { status: 429 });
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;
	const supplementsJson = formData.get("supplements") as string | null;

	if (!file) {
		return Response.json({ error: "no_file" }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		return Response.json({ error: "file_too_large" }, { status: 400 });
	}

	if (!isImage(file)) {
		return Response.json({ error: "unsupported_file_type" }, { status: 400 });
	}

	let supplements: z.infer<typeof supplementContextSchema>[] = [];

	try {
		const raw = supplementsJson ? JSON.parse(supplementsJson) : [];
		supplements = z.array(supplementContextSchema).max(200).parse(raw);
	} catch {
		return Response.json({ error: "invalid_context" }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const compressedData = await compressImage(buffer);

	try {
		const { object } = await generateObject({
			model: anthropic("claude-haiku-4-5-20251001"),
			schema: cartParseSchema,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image",
							image: compressedData,
						},
						{
							type: "text",
							text: buildPrompt(supplements),
						},
					],
				},
			],
		});

		return Response.json(object);
	} catch (e) {
		console.error("[cart/parse] AI error:", e);
		return Response.json({ error: "ai_error" }, { status: 500 });
	}
}
