import type { UserContent } from "ai";
import { generateText, Output } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { parsedProtocolSchema } from "@/features/onboarding";
import { anthropic } from "@/shared/lib/ai";
import { auth } from "@/shared/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isPdf(file: File) {
	return file.type === "application/pdf" || file.name.endsWith(".pdf");
}

function isExcel(file: File) {
	return (
		file.type.includes("spreadsheet") ||
		file.type.includes("excel") ||
		file.name.endsWith(".xlsx") ||
		file.name.endsWith(".xls")
	);
}

function isImage(file: File) {
	return IMAGE_TYPES.includes(file.type);
}

function isText(file: File) {
	return file.type === "text/plain" || file.name.endsWith(".txt");
}

function extractTextFromExcel(buffer: Buffer): string {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const lines: string[] = [];
	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		lines.push(`Sheet: ${sheetName}`);
		lines.push(XLSX.utils.sheet_to_csv(sheet));
	}
	return lines.join("\n");
}

function buildUserContent(file: File, buffer: Buffer, textContent?: string): UserContent {
	const content: UserContent = [];

	if (isPdf(file)) {
		content.push({ type: "file", data: buffer, mediaType: "application/pdf" });
		content.push({ type: "text", text: "Parse the treatment protocol from this PDF document." });
	} else if (isImage(file)) {
		content.push({ type: "image", image: buffer, mediaType: file.type });
		content.push({
			type: "text",
			text: "Parse the treatment protocol from this photo/image.",
		});
	} else {
		content.push({
			type: "text",
			text: `Parse this treatment protocol document:\n\n${textContent}`,
		});
	}

	return content;
}

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;
	const supplementsJson = formData.get("supplements") as string | null;
	const timeBlocksJson = formData.get("timeBlocks") as string | null;

	if (!file) {
		return Response.json({ error: "no_file" }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		return Response.json({ error: "file_too_large" }, { status: 400 });
	}

	if (!isPdf(file) && !isExcel(file) && !isImage(file) && !isText(file)) {
		return Response.json({ error: "unsupported_file_type" }, { status: 400 });
	}

	let supplements: unknown[] = [];
	let timeBlocks: unknown[] = [];

	try {
		supplements = supplementsJson ? JSON.parse(supplementsJson) : [];
		timeBlocks = timeBlocksJson ? JSON.parse(timeBlocksJson) : [];
	} catch {
		return Response.json({ error: "invalid_context" }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	let textContent: string | undefined;

	if (isExcel(file)) {
		try {
			textContent = extractTextFromExcel(buffer);
		} catch (err) {
			console.error("[protocol/parse] Excel extraction failed:", err);
			return Response.json({ error: "unreadable_file" }, { status: 422 });
		}
	} else if (isText(file)) {
		textContent = buffer.toString("utf-8");
	}

	if (textContent !== undefined && !textContent.trim()) {
		return Response.json({ error: "empty_file" }, { status: 422 });
	}

	const userContent = buildUserContent(file, buffer, textContent);

	const userContext = JSON.stringify({ supplements, timeBlocks }, null, 2);

	const systemPrompt = `You are a medical protocol parser. You receive a supplement/medication protocol document and user context, and you extract a structured list of supplements and their schedules.

User context (existing inventory and time blocks):
${userContext}

Rules:
- If a supplement from the protocol matches an existing one in the user context by name (fuzzy match) → set existingSupplementId to its ID
- If it doesn't match → existingSupplementId = null (will be created as new)
- timeBlockId must be the ID of one of the user's time blocks. Match doses to blocks by name/time (e.g. "rano", "morning" → "Na czczo" or "Śniadanie", "wieczór" → "Kolacja" or "Przed snem"). If no good match → use the closest by time
- category: use "medication" for prescription drugs, use the most appropriate category (vitamin, mineral, supplement, probiotic, herb, amino_acid, other) for everything else
- isCritical: set to true for medically important items where skipping could have health consequences — not just prescriptions, also key protocol supplements (e.g. thyroid medication, blood thinners, critical deficiency supplements). Use your medical knowledge to assess importance
- Same supplement appearing in multiple time blocks = ONE supplement entry with MULTIPLE schedule objects. NEVER create duplicate supplement entries for the same product. Example: "Vitamin D: morning 2000IU, evening 1000IU" → one supplement entry with two schedule objects (one for morning block, one for evening block)
- confidence: 0.0-1.0 — how certain you are about the name/linking/parsing (below 0.7 means user should verify)
- Extract ALL supplements and medications listed, even if dosage is unclear
- notes: set on the SUPPLEMENT level (not per schedule). MUST be written in Polish (e.g. "30 min przed jedzeniem", "z posiłkiem", "na pusty żołądek"). If no special notes → null
- Cycling patterns: if the protocol mentions cycling (e.g. "take for 30 days, pause 30 days", "1 month on, 1 month off", "30 dni brania, 30 dni przerwy"), set cycleDaysOn and cycleDaysOff on the supplement. Convert months to 30 days. If no cycling pattern → both null
- Dependencies: if the protocol says "take A for X days/weeks before starting B", "najpierw A przez X dni, potem B", or similar sequencing, set prerequisiteName (the supplement that goes first) and delayDays on the dependent supplement. Convert weeks to days. Names must match the supplements array. If no dependency → both null
- Return only the structured data — no explanations

MANDATORY SELF-VERIFICATION (do this before returning):
1. Check: Are there any duplicate supplement names? If yes → merge into one entry with multiple schedules
2. Check: For every supplement, re-read the source document — does the dosage, time block, and linking match?
If after both checks you are still uncertain about any field → set confidence below 0.7 so the user can verify`;

	try {
		const { output } = await generateText({
			model: anthropic("claude-haiku-4-5"),
			output: Output.object({ schema: parsedProtocolSchema }),
			system: systemPrompt,
			messages: [{ role: "user", content: userContent }],
		});

		if (!output || !output.supplements || output.supplements.length === 0) {
			return Response.json({ error: "no_supplements_found" }, { status: 422 });
		}

		return Response.json(output);
	} catch (err) {
		console.error("[protocol/parse] AI generation failed:", err);
		return Response.json({ error: "ai_error" }, { status: 500 });
	}
}
