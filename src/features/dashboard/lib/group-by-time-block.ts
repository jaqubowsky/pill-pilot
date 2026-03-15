import type { ScheduleEntry, TimeBlockStatus } from "../api/queries/get-daily-status";

type BlockInfo = {
	blockId: string;
	blockName: string;
	blockIcon: string;
	startTime: string;
	blockSortOrder: string;
};

function isActionable(entry: ScheduleEntry): boolean {
	if (entry.isExpired) return false;
	if (entry.dependency && !entry.dependency.isUnlocked) return false;
	if (entry.cycling && !entry.cycling.isOnPhase) return false;
	if (entry.cooldown && entry.cooldown.remainingMs > 0) return false;
	return true;
}

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
				actionableCount: 0,
			});
		}

		const block = blockMap.get(info.blockId)!;
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

	return Array.from(blockMap.values()).sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));
}
