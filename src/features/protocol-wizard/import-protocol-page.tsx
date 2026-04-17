import { notFound } from "next/navigation";
import { getSharedProtocol } from "./api/queries/get-shared-protocol";
import { getSupplementSummaries } from "./api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "./api/queries/get-time-block-summaries";
import { matchShareSupplements } from "./api/services/build-share-ai-content";
import { ImportProtocolForm } from "./components/import-protocol-form";
import type { ProtocolFormData } from "./components/protocol-form-base";
import {
	buildSharedParsedSupplements,
	resolveSharedTimeBlocks,
} from "./lib/resolve-shared-protocol";
import { toIdentifiedSupplements } from "./lib/supplement-serialization";
import type { TimeBlockSummary } from "./types";

type Props = {
	userId: string;
	token: string;
};

export async function ImportProtocolPage({ userId, token }: Props) {
	const [sharedProtocol, existingSupplements, recipientTimeBlocks] = await Promise.all([
		getSharedProtocol(token),
		getSupplementSummaries(userId),
		getTimeBlockSummaries(userId),
	]);

	if (!sharedProtocol) notFound();

	const sharedNames = sharedProtocol.supplements.map((s) => s.name);
	const matchedIds = await matchShareSupplements(sharedNames, existingSupplements);

	const allSchedules = sharedProtocol.supplements.flatMap((s) => s.schedules);
	const { timeBlockIdMap, timeBlocksToCreate } = resolveSharedTimeBlocks(
		allSchedules,
		recipientTimeBlocks,
	);

	const parsedSupplements = buildSharedParsedSupplements(
		sharedProtocol.supplements,
		matchedIds,
		timeBlockIdMap,
	);

	const allTimeBlocks: TimeBlockSummary[] = [
		...recipientTimeBlocks,
		...timeBlocksToCreate.map((tb) => ({ id: tb.tempId, name: tb.name, startTime: tb.startTime })),
	];

	const initialData: ProtocolFormData = {
		name: sharedProtocol.protocolName,
		supplements: toIdentifiedSupplements(parsedSupplements),
	};

	return (
		<ImportProtocolForm
			shareToken={token}
			existingSupplements={existingSupplements}
			timeBlocks={allTimeBlocks}
			initialData={initialData}
			timeBlocksToCreate={timeBlocksToCreate}
		/>
	);
}
