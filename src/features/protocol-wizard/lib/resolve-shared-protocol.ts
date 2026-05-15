import type { SharedProtocolData, SharedScheduleData } from "../api/queries/get-shared-protocol";
import type { ParsedSupplement } from "../schemas/parsed-protocol-schema";
import type { TimeBlockSummary } from "../types";

export type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

export type ResolvedSharedTimeBlocks = {
	timeBlockIdMap: Map<string, string>;
	timeBlocksToCreate: TimeBlockToCreate[];
};

function timeBlockKey(name: string): string {
	return name.toLowerCase();
}

export function resolveSharedTimeBlocks(
	allSchedules: SharedScheduleData[],
	recipientTimeBlocks: TimeBlockSummary[],
): ResolvedSharedTimeBlocks {
	const timeBlocksToCreate: TimeBlockToCreate[] = [];
	const timeBlockIdMap = new Map<string, string>();

	for (const schedule of allSchedules) {
		const key = timeBlockKey(schedule.timeBlockName);
		if (timeBlockIdMap.has(key)) continue;

		// Match by name only — if the user already has a time block with the same name,
		// use theirs (with their time). Only create a new one if the name doesn't exist at all.
		const match = recipientTimeBlocks.find((tb) => timeBlockKey(tb.name) === key);

		if (match) {
			timeBlockIdMap.set(key, match.id);
		} else {
			const tempId = crypto.randomUUID();
			timeBlocksToCreate.push({
				tempId,
				name: schedule.timeBlockName,
				icon: schedule.timeBlockIcon,
				startTime: schedule.timeBlockStartTime,
			});
			timeBlockIdMap.set(key, tempId);
		}
	}

	return { timeBlockIdMap, timeBlocksToCreate };
}

export function buildSharedParsedSupplements(
	sharedSupplements: SharedProtocolData["supplements"],
	matchedIds: Array<string | null>,
	timeBlockIdMap: Map<string, string>,
): ParsedSupplement[] {
	return sharedSupplements.map((s, i) => ({
		name: s.name,
		existingSupplementId: matchedIds[i] ?? null,
		brandName: null,
		category: s.category,
		isCritical: false,
		confidence: 1,
		notes: null,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: s.schedules[0]?.dosageIntervalMinutes ?? null,
		waitAfterTakingMinutes: null,
		uncertaintyReason: null,
		schedules: s.schedules.map((sch) => ({
			timeBlockId: timeBlockIdMap.get(timeBlockKey(sch.timeBlockName)) ?? "",
			dosageAmount: sch.dosageAmount,
			dosageUnit: sch.dosageUnit,
			notes: sch.notes,
			isCritical: sch.isCritical,
			cycleDaysOn: sch.cycleDaysOn,
			cycleDaysOff: sch.cycleDaysOff,
			startDayOffset: sch.startDayOffset,
			durationDays: sch.durationDays,
			waitAfterTakingMinutes: sch.waitAfterTakingMinutes,
			finishPackage: sch.finishPackage,
			sortOrder: sch.sortOrder,
		})),
	}));
}
