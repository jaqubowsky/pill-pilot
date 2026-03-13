import { redirect } from "next/navigation";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import { getDraftProtocol } from "./api/queries/get-draft-protocol";
import { ParsedPreview } from "./components/parsed-preview";

export async function ProtocolPreviewPage({ userId }: { userId: string }) {
	const draft = await getDraftProtocol(userId);

	if (!draft || !draft.parsed) {
		redirect("/protocol/new");
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
			showStepIndicator={false}
		/>
	);
}
