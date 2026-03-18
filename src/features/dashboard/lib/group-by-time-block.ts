import type { ScheduleEntry, TimeBlockStatus } from "../api/queries/get-daily-status";

export type BlockInfo = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	blockSortOrder: number;
};

function isActionable(entry: ScheduleEntry): boolean {
	if (entry.isExpired) return false;
	if (entry.notStartedDays !== null && entry.notStartedDays > 0) return false;
	if (entry.phase && !entry.phase.isUnlocked) return false;
	if (entry.cycling && !entry.cycling.isOnPhase) return false;
	if (entry.cooldown && entry.cooldown.remainingMs > 0) return false;
	return true;
}

export function groupByTimeBlock(
	entries: { block: BlockInfo; entry: ScheduleEntry; hasLog: boolean }[],
): TimeBlockStatus[] {
	const blockMap = new Map<string, TimeBlockStatus>();

	for (const { block: info, entry, hasLog } of entries) {
		let block = blockMap.get(info.blockId);
		if (!block) {
			block = {
				blockId: info.blockId,
				blockName: info.blockName,
				blockIcon: info.blockIcon,
				startTime: info.startTime,
				sortOrder: info.blockSortOrder,
				entries: [],
				completedCount: 0,
				actionableCount: 0,
			};
			blockMap.set(info.blockId, block);
		}

		block.entries.push(entry);
		if (isActionable(entry)) {
			block.actionableCount += 1;
			if (hasLog) {
				block.completedCount += 1;
			}
		}
	}

	for (const block of blockMap.values()) {
		block.entries.sort(
			(a, b) => Number(b.isCritical) - Number(a.isCritical) || a.sortOrder - b.sortOrder,
		);
	}

	return Array.from(blockMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
