import { generateText, Output } from "ai";
import mammoth from "mammoth";
import { revalidatePath } from "next/cache";
import { extractTextFromExcel } from "@/features/protocol-wizard/lib/excel-extraction";
import { isDocx, isExcel, isImage, isText } from "@/features/protocol-wizard/lib/file-detection";
import { anthropic } from "@/shared/lib/ai";
import { type CompressedImage, compressImageWithMediaType } from "@/shared/lib/image-compression";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { parsedProtocolSchema, rawExtractionSchema } from "../../schemas/parsed-protocol-schema";
import { buildEnrichmentContent, buildExtractionContent } from "./build-ai-content";
import { buildEnrichmentPrompt, buildExtractionPrompt } from "./build-ai-prompts";

export type ParseInput = {
	file: File;
	buffer: Buffer;
	userContext: string;
	userInstructions: string | null;
};

export async function extractTextContent(file: File, buffer: Buffer): Promise<string | undefined> {
	if (isExcel(file)) {
		return extractTextFromExcel(buffer);
	}

	if (isDocx(file)) {
		const result = await mammoth.extractRawText({ buffer });
		return result.value;
	}

	if (isText(file)) {
		return buffer.toString("utf-8");
	}

	return undefined;
}

export async function compressIfImage(
	file: File,
	buffer: Buffer,
): Promise<CompressedImage | undefined> {
	if (!isImage(file)) return undefined;
	return compressImageWithMediaType(buffer);
}

export async function runParsePipeline(
	protocolId: string,
	{ file, buffer, userContext, userInstructions }: ParseInput,
	textContent?: string,
	compressedImage?: CompressedImage,
): Promise<void> {
	const tag = `[protocol/parse][${protocolId}]`;
	console.log(`${tag} start — file="${file.name}" size=${file.size} type="${file.type}" textLen=${textContent?.length ?? "n/a"} hasImage=${!!compressedImage}`);

	try {
		const extractionContent = buildExtractionContent(file, buffer, textContent, compressedImage);
		console.log(`${tag} extraction start`);

		const { output: raw } = await generateText({
			model: anthropic("claude-haiku-4-5"),
			output: Output.object({ schema: rawExtractionSchema }),
			system: buildExtractionPrompt(),
			messages: [{ role: "user", content: extractionContent }],
		});

		console.log(`${tag} extraction done — items=${raw?.items?.length ?? 0}`);

		if (!raw?.items?.length) {
			console.warn(`${tag} extraction returned no items → marking failed`);
			await protocolRepository.updateStatus(protocolId, "failed");
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

		console.log(`${tag} enrichment start`);

		const { output } = await generateText({
			model: anthropic("claude-sonnet-4-5"),
			output: Output.object({ schema: parsedProtocolSchema }),
			system: buildEnrichmentPrompt(userContext, userInstructions),
			messages: [{ role: "user", content: enrichmentContent }],
		});

		console.log(`${tag} enrichment done — supplements=${output?.supplements?.length ?? 0}`);

		if (!output?.supplements?.length) {
			console.warn(`${tag} enrichment returned no supplements → marking failed`);
			await protocolRepository.updateStatus(protocolId, "failed");
			revalidatePath("/settings");
			return;
		}

		await protocolRepository.update(protocolId, {
			parsedData: JSON.stringify(output),
			name: output.protocolName,
			status: "draft",
		});
		console.log(`${tag} saved as draft — name="${output.protocolName}"`);
		revalidatePath("/settings");
	} catch (err) {
		console.error(`${tag} pipeline failed:`, err);
		await protocolRepository.updateStatus(protocolId, "failed");
		revalidatePath("/settings");
	}
}
