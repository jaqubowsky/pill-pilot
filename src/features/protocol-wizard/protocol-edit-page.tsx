import { redirect } from "next/navigation";
import { getProtocolAsParsed } from "@/features/settings/api/queries/get-protocol-as-parsed";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import { ParsedPreview } from "./components/parsed-preview";

type ProtocolEditPageProps = {
	userId: string;
	protocolId: string;
};

export async function ProtocolEditPage({ userId, protocolId }: ProtocolEditPageProps) {
	const result = await getProtocolAsParsed(protocolId, userId);

	if (!result) {
		redirect("/settings");
	}

	const { parsed, startDate } = result;

	const timeBlocks = await timeBlockRepository.findByUserId(userId);

	return (
		<ParsedPreview
			protocolId={protocolId}
			initialParsed={parsed}
			timeBlocks={timeBlocks.map((tb) => ({
				id: tb.id,
				name: tb.name,
				startTime: tb.startTime,
			}))}
			mode="edit"
			initialStartDate={startDate ?? undefined}
		/>
	);
}
