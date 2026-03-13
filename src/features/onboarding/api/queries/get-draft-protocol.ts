import { parsedProtocolSchema } from "@/features/onboarding/schemas/parsed-protocol-schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export async function getDraftProtocol(userId: string) {
	const draft = await protocolRepository.findDraftByUserId(userId);
	if (!draft) return null;

	try {
		const parsed = parsedProtocolSchema.parse(JSON.parse(draft.parsedData));
		return { protocol: draft, parsed };
	} catch (err) {
		console.error("[get-draft-protocol] Failed to parse draft data:", err);
		return { protocol: draft, parsed: null };
	}
}
