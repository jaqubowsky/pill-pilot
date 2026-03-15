import type { UserContent } from "ai";
import { generateText, Output } from "ai";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import {
	CONFIDENCE_THRESHOLD,
	parsedProtocolSchema,
	rawExtractionSchema,
} from "@/features/protocol-wizard";
import { anthropic } from "@/shared/lib/ai";
import { auth } from "@/shared/lib/auth";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

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

function isDocx(file: File) {
	return (
		file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
		file.name.endsWith(".docx")
	);
}

function isText(file: File) {
	return file.type === "text/plain" || file.name.endsWith(".txt");
}

async function compressImage(buffer: Buffer): Promise<{ data: Buffer; mediaType: string }> {
	if (buffer.byteLength <= MAX_IMAGE_BYTES) {
		const meta = await sharp(buffer).metadata();
		const mediaType =
			meta.format === "png"
				? "image/png"
				: meta.format === "webp"
					? "image/webp"
					: meta.format === "gif"
						? "image/gif"
						: "image/jpeg";
		return { data: buffer, mediaType };
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
		return { data: compressed, mediaType: "image/jpeg" };
	}

	const further = await sharp(buffer)
		.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
		.jpeg({ quality: 50 })
		.toBuffer();
	return { data: further, mediaType: "image/jpeg" };
}

function getCellColor(cell: ExcelJS.Cell): string | null {
	const fill = cell.fill;
	if (!fill || fill.type !== "pattern" || !fill.fgColor) return null;
	const color = fill.fgColor;
	if (color.argb) {
		const hex = color.argb.slice(2).toLowerCase();
		if (hex === "ffffff" || hex === "000000") return null;
		return `#${hex}`;
	}
	return null;
}

async function extractTextFromExcel(buffer: Buffer): Promise<string> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
	const lines: string[] = [];
	for (const worksheet of workbook.worksheets) {
		lines.push(`Sheet: ${worksheet.name}`);

		const legendColors = new Map<string, string>();
		const legendRow = worksheet.getRow(2);
		if (legendRow) {
			legendRow.eachCell((cell, colNumber) => {
				const color = getCellColor(cell);
				const text = String(cell.value ?? "").trim();
				if (color && text) {
					legendColors.set(color, text);
				}
			});
		}

		if (legendColors.size > 0) {
			lines.push(
				`COLOR LEGEND: ${Array.from(legendColors.entries())
					.map(([c, t]) => `${c}=${t}`)
					.join(", ")}`,
			);
		}

		worksheet.eachRow((row, rowNumber) => {
			const values = row.values as (string | number | null | undefined)[];
			const text = values.slice(1).join(",");

			const firstCell = row.getCell(1);
			const color = getCellColor(firstCell);
			const phase = color ? legendColors.get(color) : null;

			if (phase) {
				lines.push(`[PHASE: ${phase}] ${text}`);
			} else {
				lines.push(text);
			}
		});
	}
	return lines.join("\n");
}

function buildExtractionContent(
	file: File,
	buffer: Buffer,
	textContent?: string,
	compressedImage?: { data: Buffer; mediaType: string },
): UserContent {
	const content: UserContent = [];

	if (isPdf(file)) {
		content.push({ type: "file", data: buffer, mediaType: "application/pdf" });
		content.push({
			type: "text",
			text: "Extract all supplements and medications from this PDF document.",
		});
	} else if (isImage(file) && compressedImage) {
		content.push({
			type: "image",
			image: compressedImage.data,
			mediaType: compressedImage.mediaType,
		});
		content.push({
			type: "text",
			text: "Extract all supplements and medications from this image.",
		});
	} else {
		content.push({
			type: "text",
			text: `Extract all supplements and medications from this document:\n\n${textContent}`,
		});
	}

	return content;
}

function buildExtractionPrompt(): string {
	return `You are a medical document parser. Extract ALL supplements and medications from the provided document (typically in Polish).

<instructions>
- Extract every supplement and medication mentioned, even if dosage is unclear.
- For each item, capture the raw text exactly as written — do NOT interpret or normalize.
- name: product name as written (e.g. "NAC 600mg", "Witamina D3 2000 IU")
- rawDosage: dosage as written (e.g. "2x1 kapsułka", "2000 IU rano + 1000 IU wieczór")
- rawTiming: when to take as written (e.g. "na czczo", "z posiłkiem", "rano i wieczorem")
- rawNotes: any special instructions AND duration/period info as written (e.g. "30 min przed jedzeniem", "rozpuścić w wodzie", "Okres: 2-3 msc", "Okres: Leczenie jelit", "Okres: Zużyć 2 opak.", "Okres: Czas leczenia + do zużycia opak."). Include the "Okres" column value if present. null if none.
- rawCategory: type as written or inferred (e.g. "witamina", "minerał", "antybiotyk", "probiotyk")
- rawCycling: cycling pattern as written (e.g. "30 dni brania, 30 dni przerwy"). null if none.
- rawDependency: dependency/sequencing info as written (e.g. "zacząć 2 tyg przed lekami", "po zakończeniu antybiotyku"). null if none.
- rawInterval: dosing interval as written (e.g. "co 6 godzin", "co 8h", "3x dziennie"). null if none.
- rawWaitAfter: post-take wait as written (e.g. "30 min przed jedzeniem", "na czczo 45 min", "pół godziny przed posiłkiem"). null if none.
- isMedication: true for prescription drugs (antibiotics, thyroid meds, etc.), false for supplements.
- protocolName: derive a short name for the protocol from the document title or content.
</instructions>

<excel_phases>
Rows may have [PHASE: ...] prefixes from cell background colors. Include phase info in rawDependency.
</excel_phases>

Return ONLY the structured JSON. No prose.`;
}

function buildEnrichmentPrompt(userContext: string): string {
	return `You are a medical protocol enrichment system. You receive raw extracted supplement data and must match, structure, and score each item against the user's inventory and time blocks.

<user_context>
${userContext}
</user_context>

<instructions>
Process each raw extraction item into a structured supplement entry. Follow every rule precisely.

<matching>
SUPPLEMENT MATCHING:
- Fuzzy-match each item name against user_context supplements (spelling variations, abbreviations, brand names).
- Match found → set existingSupplementId to the user's supplement ID.
- No match → set existingSupplementId to null (creates a new supplement).

TIME BLOCK MATCHING:
- Assign each dose to a user time block by ID based on rawTiming AND rawDosage.
- CRITICAL: Pay attention to PRZED (before) vs PO (after) vs DO (with) — these mean DIFFERENT time blocks.
- Match by Polish keywords:
  "na czczo", "rano na czczo", "przed śniadaniem", "PRZED śniadaniem" → Na czczo block
  "do śniadania", "ze śniadaniem" → Śniadanie block
  "2. śniadanie", "drugie śniadanie" → 2. śniadanie block
  "przed obiadem", "PRZED obiadem" → Przed obiadem block
  "do obiadu", "z obiadem" → Obiad block
  "przed kolacją", "PRZED kolacją" → Przed kolacją block
  "do kolacji", "z kolacją" → Kolacja block
  "po kolacji", "PO kolacji" → Po kolacji block
  "przed snem", "na noc" → Przed snem block
- If timing says "PRZED [meal]" → use the "Przed [meal]" block, NOT the meal block.
- If timing says "PO [meal]" → use the "Po [meal]" block, NOT the meal block.
- If ambiguous, pick the closest time block by typical timing and set confidence below ${CONFIDENCE_THRESHOLD}.
</matching>

<categories>
- "medication" — prescription drugs only.
- For everything else, pick the best fit: vitamin, mineral, supplement, probiotic, herb, amino_acid, other.
</categories>

<critical_flag>
isCritical = true when skipping would have health consequences:
- Prescription medications (thyroid, blood thinners, antibiotics, chronic conditions).
- Supplements addressing diagnosed deficiencies.
isCritical = false for general wellness supplements.
</critical_flag>

<schedule_consolidation>
CRITICAL: One supplement entry per product. If the same supplement appears at multiple time blocks, create ONE entry with MULTIPLE schedule objects.
Example: "Witamina D: 2000 IU rano, 1000 IU wieczór" → one supplement, two schedules (one per time block).
NEVER duplicate supplement entries.
</schedule_consolidation>

<confidence_and_uncertainty>
Score 0.0–1.0 reflecting certainty about name, dosage, linking, and parsing.
Set below ${CONFIDENCE_THRESHOLD} when: dosage unclear, name ambiguous, matching uncertain, information missing.
When confidence < ${CONFIDENCE_THRESHOLD}, you MUST set uncertaintyReason — a short explanation in Polish of what's uncertain.
Examples: "Dawka nieczytelna", "Nazwa niejednoznaczna", "Nie udało się dopasować do istniejącego suplementu", "Brak informacji o dawkowaniu".
When confidence >= ${CONFIDENCE_THRESHOLD}, set uncertaintyReason to null.
</confidence_and_uncertainty>

<notes_rules>
- Set at the SUPPLEMENT level (not per schedule).
- MUST be in Polish.
- Include medical intake instructions: "30 min przed jedzeniem", "z posiłkiem", "na pusty żołądek", "rozpuścić w wodzie", "2h odstępu od leków".
- Include phase/sequencing info: "zacząć 2 tyg przed antybiotykiem", "brać w trakcie antybiotyku", "brać po zakończeniu antybiotyku".
- Include duration/period info from rawNotes (e.g. "Okres: 2-3 msc", "Okres: Leczenie jelit", "Okres: Zużyć 2 opak."). Keep as-is in Polish.
- EXCLUDE: discount codes, promo codes, shop names, URLs, prices, purchase info.
- If no special instructions → null.
</notes_rules>

<cycling>
If rawCycling mentions cycling ("30 dni brania, 30 dni przerwy", "1 miesiąc brania, 1 miesiąc przerwy"):
- Set cycleDaysOn and cycleDaysOff. Convert months → 30 days.
If no cycling pattern → both null.
</cycling>

<dosage_interval>
dosageIntervalMinutes: minimum minutes between doses. ONLY for hard medical requirements.
Derived from rawInterval:
- "co 6 godzin" → 360
- "co 8h" → 480
- "co 12 godzin" → 720
ONLY set for medications with explicit interval instructions (antibiotics, strict dosing schedules).
DO NOT derive from frequency like "3x dziennie" or "2x dziennie" — those are just scheduling, not medical interval requirements.
If no explicit interval requirement → null.
</dosage_interval>

<wait_after_taking>
waitAfterTakingMinutes: minutes to wait after taking before eating/other supplements.
Derived from rawWaitAfter:
- "30 min przed jedzeniem" → 30
- "na czczo 45 min" → 45
- "pół godziny przed posiłkiem" → 30
- "15 minut przed jedzeniem" → 15
If no wait requirement → null.
Typical for supplements taken on empty stomach (glutamine, thyroid meds).
</wait_after_taking>

<start_day_offset>
startDayOffset: day number (from protocol start) when this supplement becomes active.
- 0 = starts immediately (day 0 of the protocol).
- Use rawDependency and phase info to determine the offset.

Examples:
- rawDependency="zacząć 2 tyg przed lekami" → this supplement starts at day 0, medications start at day 14.
- rawDependency="po zakończeniu antybiotyku" → if antibiotics are 14 days, this starts at day 28 (or appropriate offset).
- No phase/dependency info → startDayOffset = 0.

Phase mapping from rawDependency or [PHASE: ...]:
- "Stale" / no phase → startDayOffset = 0
- "2 tyg PRZED lekami" → startDayOffset = 0 (these start first; medications get startDayOffset = 14)
- "W trakcie antybiotyku" → same startDayOffset as antibiotics
- "Po antybiotyku" → startDayOffset = antibiotics offset + antibiotic duration

Rules:
- "2 tyg" → 14, "1 msc" → 30
- ALL medications in the same phase should share the same startDayOffset
- ALL supplements in a "before medications" phase should share the same startDayOffset (typically 0)
- Include sequencing info in notes too (e.g. "zacząć 2 tyg przed antybiotykiem")
- The SAME supplement CAN appear as separate entries with different startDayOffset/durationDays if it's taken at different times in different phases (e.g. Debretin during antibiotics in Kolacja block AND Debretin after antibiotics in Przed snem block).
</start_day_offset>

<duration_days>
durationDays: how many days to take this supplement. null = indefinitely/permanently.
Derived from the "Okres" column or rawNotes duration info.

Mapping:
- "Stale" → null (permanent)
- "14 dni antybiotyk" → 14
- "2-3 msc" → 75 (midpoint)
- "3 msc" → 90
- "~miesiąc" → 30
- "Czas leczenia" → null (duration unknown, keep in notes)
- "Leczenie jelit" → null (duration unknown, keep in notes)
- "Leczenie + 1 msc po" → null (duration unknown, keep in notes)
- "Do zużycia opakowania" → null (stock system handles cutoff)
- "Zużyć 2 opak." → null (stock-based)
- "Min. 6 msc" → 180

Rules:
- Convert months → 30 days each
- For ranges like "2-3 msc", use the midpoint
- If unclear, set null and lower confidence
</duration_days>
</instructions>

<verification>
Before outputting, self-check:
1. DUPLICATES — Same supplement name at same phase? Merge into one entry with multiple schedules. Different phases? Keep as separate entries.
2. NOTES — All in Polish, no discount codes/URLs/purchase info.
3. CONFIDENCE — Uncertain entries below ${CONFIDENCE_THRESHOLD}, each with uncertaintyReason in Polish.
4. START DAY OFFSETS — Supplements in the same phase share the same offset. Medications that start later have higher offsets.
5. DURATION — Each supplement has durationDays matching its "Okres" value. null for permanent ("Stale") or stock-based.
</verification>

Return ONLY the structured JSON object matching the schema. No prose, no explanations.`;
}

function buildEnrichmentContent(
	file: File,
	buffer: Buffer,
	rawExtraction: string,
	textContent?: string,
	compressedImage?: { data: Buffer; mediaType: string },
): UserContent {
	const content: UserContent = [];

	if (isPdf(file)) {
		content.push({ type: "file", data: buffer, mediaType: "application/pdf" });
	} else if (isImage(file) && compressedImage) {
		content.push({
			type: "image",
			image: compressedImage.data,
			mediaType: compressedImage.mediaType,
		});
	}

	const text = textContent
		? `<raw_extraction>\n${rawExtraction}\n</raw_extraction>\n\n<original_document>\n${textContent}\n</original_document>`
		: `<raw_extraction>\n${rawExtraction}\n</raw_extraction>`;

	content.push({
		type: "text",
		text: `Enrich this raw extraction into structured protocol data:\n\n${text}`,
	});

	return content;
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
	const timeBlocksJson = formData.get("timeBlocks") as string | null;

	if (!file) {
		return Response.json({ error: "no_file" }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		return Response.json({ error: "file_too_large" }, { status: 400 });
	}

	if (!isPdf(file) && !isExcel(file) && !isDocx(file) && !isImage(file) && !isText(file)) {
		return Response.json({ error: "unsupported_file_type" }, { status: 400 });
	}

	const contextItemSchema = z.object({
		id: z.string().max(128),
		name: z.string().max(200),
	});

	let supplements: z.infer<typeof contextItemSchema>[] = [];
	let timeBlocks: z.infer<typeof contextItemSchema>[] = [];

	try {
		const rawSupplements = supplementsJson ? JSON.parse(supplementsJson) : [];
		const rawTimeBlocks = timeBlocksJson ? JSON.parse(timeBlocksJson) : [];
		supplements = z.array(contextItemSchema).max(200).parse(rawSupplements);
		timeBlocks = z.array(contextItemSchema).max(50).parse(rawTimeBlocks);
	} catch {
		return Response.json({ error: "invalid_context" }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	let textContent: string | undefined;

	if (isExcel(file)) {
		try {
			textContent = await extractTextFromExcel(buffer);
		} catch (err) {
			console.error("[protocol/parse] Excel extraction failed:", err);
			return Response.json({ error: "unreadable_file" }, { status: 422 });
		}
	} else if (isDocx(file)) {
		try {
			const result = await mammoth.extractRawText({ buffer });
			textContent = result.value;
		} catch (err) {
			console.error("[protocol/parse] DOCX extraction failed:", err);
			return Response.json({ error: "unreadable_file" }, { status: 422 });
		}
	} else if (isText(file)) {
		textContent = buffer.toString("utf-8");
	}

	if (textContent !== undefined && !textContent.trim()) {
		return Response.json({ error: "empty_file" }, { status: 422 });
	}

	let compressedImage: { data: Buffer; mediaType: string } | undefined;
	if (isImage(file)) {
		compressedImage = await compressImage(buffer);
	}

	const extractionContent = buildExtractionContent(file, buffer, textContent, compressedImage);
	const userContext = JSON.stringify({ supplements, timeBlocks }, null, 2);

	const protocol = await protocolRepository.create({
		userId,
		name: file.name,
		parsedData: null,
		status: "processing",
	});

	after(async () => {
		try {
			const { output: raw } = await generateText({
				model: anthropic("claude-haiku-4-5"),
				output: Output.object({ schema: rawExtractionSchema }),
				system: buildExtractionPrompt(),
				messages: [{ role: "user", content: extractionContent }],
			});

			if (!raw?.items?.length) {
				await protocolRepository.updateStatus(protocol.id, "failed");
				revalidatePath("/settings");
				return;
			}

			const rawJson = JSON.stringify(raw);
			const enrichmentContent = buildEnrichmentContent(
				file,
				buffer,
				rawJson,
				textContent,
				compressedImage,
			);

			const { output } = await generateText({
				model: anthropic("claude-sonnet-4-5"),
				output: Output.object({ schema: parsedProtocolSchema }),
				system: buildEnrichmentPrompt(userContext),
				messages: [{ role: "user", content: enrichmentContent }],
			});

			if (!output?.supplements?.length) {
				await protocolRepository.updateStatus(protocol.id, "failed");
				revalidatePath("/settings");
				return;
			}

			await protocolRepository.update(protocol.id, {
				parsedData: JSON.stringify(output),
				name: output.protocolName,
				status: "draft",
			});
			revalidatePath("/settings");
		} catch (err) {
			console.error("[protocol/parse] AI generation failed:", err);
			await protocolRepository.updateStatus(protocol.id, "failed");
			revalidatePath("/settings");
		}
	});

	return Response.json({ protocolId: protocol.id });
}
