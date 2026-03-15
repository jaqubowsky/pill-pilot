import { redirect } from "next/navigation";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import { getProtocolForPreview } from "./api/queries/get-protocol-for-preview";
import { ParsedPreview } from "./components/parsed-preview";

type Props = {
	userId: string;
	protocolId: string;
};

export async function ProtocolPreviewPage({ userId, protocolId }: Props) {
	const draft = await getProtocolForPreview(protocolId, userId);

	if (!draft) {
		redirect("/settings");
	}

	const [timeBlocks, supplements] = await Promise.all([
		timeBlockRepository.findByUserId(userId),
		supplementRepository.findByUserId(userId),
	]);

	return (
		<ParsedPreview
			protocolId={draft.protocol.id}
			initialParsed={draft.parsed}
			timeBlocks={timeBlocks.map((tb) => ({
				id: tb.id,
				name: tb.name,
				startTime: tb.startTime,
			}))}
			existingSupplements={supplements.map((s) => ({
				id: s.id,
				name: s.name,
				brandName: s.brandName,
			}))}
		/>
	);
}
