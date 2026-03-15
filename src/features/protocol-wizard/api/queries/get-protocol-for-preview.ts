import { parsedProtocolSchema } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { ActionError } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export async function getProtocolForPreview(protocolId: string, userId: string) {
	const protocol = await protocolRepository
		.findByIdAndUserId(protocolId, userId)
		.catch((err) => {
			if (err instanceof ActionError) return null;
			throw err;
		});

	if (!protocol) return null;

	if (protocol.status !== "draft" || !protocol.parsedData) {
		return null;
	}

	try {
		const parsed = parsedProtocolSchema.parse(JSON.parse(protocol.parsedData));
		return { protocol, parsed };
	} catch (err) {
		console.error("[get-protocol-for-preview] Failed to parse data:", err);
		return null;
	}
}
