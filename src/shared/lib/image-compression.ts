import sharp from "sharp";

const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;
const MAX_DIMENSION = 2048;

export async function compressImageToBuffer(buffer: Buffer): Promise<Buffer> {
	if (buffer.byteLength <= MAX_IMAGE_BYTES) {
		return buffer;
	}

	const meta = await sharp(buffer).metadata();
	const needsResize =
		meta.width && meta.height && (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION);

	let pipeline = sharp(buffer);
	if (needsResize) {
		pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
			fit: "inside",
			withoutEnlargement: true,
		});
	}

	const compressed = await pipeline.jpeg({ quality: 80 }).toBuffer();
	if (compressed.byteLength <= MAX_IMAGE_BYTES) {
		return compressed;
	}

	return sharp(buffer)
		.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
		.jpeg({ quality: 50 })
		.toBuffer();
}

function resolveMediaType(format: string | undefined): string {
	switch (format) {
		case "png":
			return "image/png";
		case "webp":
			return "image/webp";
		case "gif":
			return "image/gif";
		default:
			return "image/jpeg";
	}
}

export type CompressedImage = {
	data: Buffer;
	mediaType: string;
};

export async function compressImageWithMediaType(buffer: Buffer): Promise<CompressedImage> {
	if (buffer.byteLength <= MAX_IMAGE_BYTES) {
		const meta = await sharp(buffer).metadata();
		return { data: buffer, mediaType: resolveMediaType(meta.format) };
	}

	const compressed = await compressImageToBuffer(buffer);
	return { data: compressed, mediaType: "image/jpeg" };
}
