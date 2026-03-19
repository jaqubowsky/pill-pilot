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
	try {
		const extractionContent = buildExtractionContent(file, buffer, textContent, compressedImage);

		const { output: raw } = await generateText({
			model: anthropic("claude-haiku-4-5"),
			output: Output.object({ schema: rawExtractionSchema }),
			system: buildExtractionPrompt(),
			messages: [{ role: "user", content: extractionContent }],
		});

		if (!raw?.items?.length) {
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

		const { output } = await generateText({
			model: anthropic("claude-sonnet-4-5"),
			output: Output.object({ schema: parsedProtocolSchema }),
			system: buildEnrichmentPrompt(userContext, userInstructions),
			messages: [{ role: "user", content: enrichmentContent }],
		});

		if (!output?.supplements?.length) {
			await protocolRepository.updateStatus(protocolId, "failed");
			revalidatePath("/settings");
			return;
		}

		await protocolRepository.update(protocolId, {
			parsedData: JSON.stringify(output),
			name: output.protocolName,
			status: "draft",
		});
		revalidatePath("/settings");
	} catch {
		await protocolRepository.updateStatus(protocolId, "failed");
		revalidatePath("/settings");
	}
}
