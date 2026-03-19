import { getSupplementSummaries } from "./api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "./api/queries/get-time-block-summaries";
import { ManualProtocolForm } from "./components/manual-protocol-form";

export async function ProtocolManualPage({ userId }: { userId: string }) {
	const [timeBlocks, supplements] = await Promise.all([
		getTimeBlockSummaries(userId),
		getSupplementSummaries(userId),
	]);

	return <ManualProtocolForm supplements={supplements} timeBlocks={timeBlocks} />;
}
