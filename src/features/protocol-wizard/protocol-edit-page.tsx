import { redirect } from "next/navigation";
import { getProtocolAsParsed } from "@/features/settings/api/queries/get-protocol-as-parsed";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
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

	const [timeBlocks, supplements] = await Promise.all([
		timeBlockRepository.findByUserId(userId),
		supplementRepository.findByUserId(userId),
	]);

	return (
		<ParsedPreview
			protocolId={protocolId}
			initialParsed={parsed}
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
			mode="edit"
			initialStartDate={startDate ?? undefined}
		/>
	);
}
