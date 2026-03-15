import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import { ManualProtocolForm } from "./components/manual-protocol-form";

export async function ProtocolManualPage({ userId }: { userId: string }) {
	const [timeBlocks, supplements] = await Promise.all([
		timeBlockRepository.findByUserId(userId),
		supplementRepository.findByUserId(userId),
	]);

	return (
		<ManualProtocolForm
			supplements={supplements.map((s) => ({
				id: s.id,
				name: s.name,
				brandName: s.brandName,
			}))}
			timeBlocks={timeBlocks.map((tb) => ({
				id: tb.id,
				name: tb.name,
				startTime: tb.startTime,
			}))}
		/>
	);
}
