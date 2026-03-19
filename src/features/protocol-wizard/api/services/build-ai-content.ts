import type { UserContent } from "ai";
import { isImage, isPdf } from "@/features/protocol-wizard/lib/file-detection";
import type { CompressedImage } from "@/shared/lib/image-compression";

export function buildExtractionContent(
	file: File,
	buffer: Buffer,
	textContent?: string,
	compressedImage?: CompressedImage,
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

export function buildEnrichmentContent(
	file: File,
	buffer: Buffer,
	rawExtraction: string,
	textContent?: string,
	compressedImage?: CompressedImage,
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
