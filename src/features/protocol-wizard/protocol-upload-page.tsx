import { getActiveProtocolSummaries } from "./api/queries/get-active-protocol-summaries";
import { getSupplementSummaries } from "./api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "./api/queries/get-time-block-summaries";
import { UploadStep } from "./components/upload-step";

export async function ProtocolUploadPage({ userId }: { userId: string }) {
	const [timeBlocks, supplements, activeProtocols] = await Promise.all([
		getTimeBlockSummaries(userId),
		getSupplementSummaries(userId),
		getActiveProtocolSummaries(userId),
	]);

	return (
		<UploadStep
			activeProtocols={activeProtocols}
			supplements={supplements}
			timeBlocks={timeBlocks}
		/>
	);
}
