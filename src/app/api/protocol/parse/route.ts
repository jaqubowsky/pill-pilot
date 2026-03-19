import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import {
	compressIfImage,
	extractTextContent,
	runParsePipeline,
} from "@/features/protocol-wizard/api/services/protocol-parse-service";
import { isSupportedFile } from "@/features/protocol-wizard/lib/file-detection";
import { auth } from "@/shared/lib/auth";
import { createRateLimiter } from "@/shared/lib/rate-limit";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const isRateLimited = createRateLimiter({ maxRequests: 5 });

const contextItemSchema = z.object({
	id: z.string().max(128),
	name: z.string().max(200),
});

const activeProtocolSchema = z.object({
	name: z.string().max(200),
	supplements: z.array(z.string().max(200)).max(100),
});

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
	const timeBlocksJson = formData.get("timeBlocks") as string | null;
	const userInstructionsRaw = formData.get("userInstructions") as string | null;
	const activeProtocolsJson = formData.get("activeProtocols") as string | null;

	if (!file) {
		return Response.json({ error: "no_file" }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		return Response.json({ error: "file_too_large" }, { status: 400 });
	}

	if (!isSupportedFile(file)) {
		return Response.json({ error: "unsupported_file_type" }, { status: 400 });
	}

	let supplements: z.infer<typeof contextItemSchema>[] = [];
	let timeBlocks: z.infer<typeof contextItemSchema>[] = [];
	let userInstructions: string | null = null;
	let activeProtocols: z.infer<typeof activeProtocolSchema>[] = [];

	try {
		const rawSupplements = supplementsJson ? JSON.parse(supplementsJson) : [];
		const rawTimeBlocks = timeBlocksJson ? JSON.parse(timeBlocksJson) : [];
		supplements = z.array(contextItemSchema).max(200).parse(rawSupplements);
		timeBlocks = z.array(contextItemSchema).max(50).parse(rawTimeBlocks);

		if (userInstructionsRaw) {
			userInstructions = z.string().max(1000).parse(userInstructionsRaw);
		}
		if (activeProtocolsJson) {
			const rawActiveProtocols = JSON.parse(activeProtocolsJson);
			activeProtocols = z.array(activeProtocolSchema).max(20).parse(rawActiveProtocols);
		}
	} catch {
		return Response.json({ error: "invalid_context" }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	let textContent: string | undefined;
	try {
		textContent = await extractTextContent(file, buffer);
	} catch (err) {
		console.error("[protocol/parse] Text extraction failed:", err);
		return Response.json({ error: "unreadable_file" }, { status: 422 });
	}

	if (textContent !== undefined && !textContent.trim()) {
		return Response.json({ error: "empty_file" }, { status: 422 });
	}

	const compressedImage = await compressIfImage(file, buffer);

	const userContextObj = userInstructions
		? { supplements, timeBlocks, activeProtocols }
		: { supplements, timeBlocks };
	const userContext = JSON.stringify(userContextObj, null, 2);

	const protocol = await protocolRepository.create({
		userId,
		name: file.name,
		parsedData: null,
		status: "processing",
	});

	after(async () => {
		await runParsePipeline(
			protocol.id,
			{ file, buffer, userContext, userInstructions },
			textContent,
			compressedImage,
		);
	});

	return Response.json({ protocolId: protocol.id });
}
