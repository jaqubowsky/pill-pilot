import { redirect } from "next/navigation";
import { getProtocolAsParsed } from "@/features/protocol-wizard/api/queries/get-protocol-as-parsed";
import { getSupplementSummaries } from "./api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "./api/queries/get-time-block-summaries";
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

	const [timeBlocks, supplements] = await Promise.all([
		getTimeBlockSummaries(userId),
		getSupplementSummaries(userId),
	]);

	return (
		<ParsedPreview
			protocolId={protocolId}
			initialParsed={parsed}
			timeBlocks={timeBlocks}
			existingSupplements={supplements}
			mode="edit"
			initialStartDate={startDate ?? undefined}
		/>
	);
}
