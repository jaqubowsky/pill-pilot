import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import {
	buildSharedParsedSupplements,
	resolveSharedTimeBlocks,
} from "../../lib/resolve-shared-protocol";
import { getSharedProtocol } from "../queries/get-shared-protocol";
import { getSupplementSummaries } from "../queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "../queries/get-time-block-summaries";
import { matchShareSupplements } from "./build-share-ai-content";

export async function importSharedProtocolDraft({
	token,
	userId,
}: {
	token: string;
	userId: string;
}): Promise<string | null> {
	const [sharedProtocol, existingSupplements, recipientTimeBlocks] = await Promise.all([
		getSharedProtocol(token),
		getSupplementSummaries(userId),
		getTimeBlockSummaries(userId),
	]);

	if (!sharedProtocol) return null;

	const sharedNames = sharedProtocol.supplements.map((s) => s.name);
	const matchedIds = await matchShareSupplements(sharedNames, existingSupplements);

	const allSchedules = sharedProtocol.supplements.flatMap((s) => s.schedules);
	const { timeBlockIdMap, timeBlocksToCreate } = resolveSharedTimeBlocks(
		allSchedules,
		recipientTimeBlocks,
	);

	if (timeBlocksToCreate.length > 0) {
		const created = await Promise.all(
			timeBlocksToCreate.map((tb) =>
				timeBlockRepository.create({
					userId,
					name: tb.name,
					icon: tb.icon,
					startTime: tb.startTime,
				}),
			),
		);
		for (let i = 0; i < timeBlocksToCreate.length; i++) {
			const tb = timeBlocksToCreate[i];
			timeBlockIdMap.set(`${tb.name.toLowerCase()}|${tb.startTime}`, created[i].id);
		}
	}

	const parsedSupplements = buildSharedParsedSupplements(
		sharedProtocol.supplements,
		matchedIds,
		timeBlockIdMap,
	);

	const protocol = await protocolRepository.create({
		userId,
		name: sharedProtocol.protocolName,
		parsedData: JSON.stringify({
			protocolName: sharedProtocol.protocolName,
			supplements: parsedSupplements,
		}),
		status: "draft",
	});

	return protocol.id;
}
