import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import type { TimeBlockSummary } from "../../types";

export async function getTimeBlockSummaries(userId: string): Promise<TimeBlockSummary[]> {
	const timeBlocks = await timeBlockRepository.findByUserId(userId);

	return timeBlocks.map((tb) => ({
		id: tb.id,
		name: tb.name,
		startTime: tb.startTime,
	}));
}
