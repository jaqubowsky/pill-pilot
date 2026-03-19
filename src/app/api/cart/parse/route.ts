import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { supplementContextSchema } from "@/features/shopping/api/services/build-cart-prompt";
import { runCartParsePipeline } from "@/features/shopping/api/services/cart-parse-service";
import { db } from "@/shared/db/client";
import { cartScans } from "@/shared/db/schema";
import { auth } from "@/shared/lib/auth";
import { compressImageToBuffer } from "@/shared/lib/image-compression";
import { createRateLimiter } from "@/shared/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const isRateLimited = createRateLimiter({ maxRequests: 10 });

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

	if (!IMAGE_TYPES.includes(file.type)) {
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
	const compressedData = await compressImageToBuffer(buffer);

	const [scan] = await db
		.insert(cartScans)
		.values({
			userId,
			status: "processing",
			shopName: null,
			items: null,
		})
		.returning({ id: cartScans.id });

	after(async () => {
		await runCartParsePipeline(scan.id, compressedData, supplements);
	});

	return Response.json({ scanId: scan.id });
}
