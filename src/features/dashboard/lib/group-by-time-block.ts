import type { ScheduleEntry, TimeBlockStatus } from "../api/queries/get-daily-status";

type BlockInfo = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	blockSortOrder: number;
};

export function groupByTimeBlock(
	entries: { block: BlockInfo; entry: ScheduleEntry; hasLog: boolean }[],
): TimeBlockStatus[] {
	const blockMap = new Map<string, TimeBlockStatus>();

	for (const { block: info, entry, hasLog } of entries) {
		if (!blockMap.has(info.blockId)) {
			blockMap.set(info.blockId, {
				blockId: info.blockId,
				blockName: info.blockName,
				blockIcon: info.blockIcon,
				startTime: info.startTime,
				sortOrder: info.blockSortOrder,
				entries: [],
				completedCount: 0,
			});
		}

		const block = blockMap.get(info.blockId)!;
		block.entries.push(entry);
		if (hasLog) {
			block.completedCount += 1;
		}
	}

	for (const block of blockMap.values()) {
		block.entries.sort((a, b) => a.sortOrder - b.sortOrder);
	}

	return Array.from(blockMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
