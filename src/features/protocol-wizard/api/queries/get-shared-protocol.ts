import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import type { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import { supplementSchedules, supplements, timeBlocks } from "@/shared/db/schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export type SharedScheduleData = {
	timeBlockName: string;
	timeBlockIcon: string;
	timeBlockStartTime: string;
	dosageAmount: number;
	dosageUnit: DosageUnit;
	notes: string | null;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	dosageIntervalMinutes: number | null;
	waitAfterTakingMinutes: number | null;
	sortOrder: number;
	finishPackage: boolean;
};

export type SharedProtocolData = {
	protocolName: string;
	supplements: {
		name: string;
		category: SupplementCategory;
		stockUnit: DosageUnit;
		schedules: SharedScheduleData[];
	}[];
};

export async function getSharedProtocol(token: string): Promise<SharedProtocolData | null> {
	const protocol = await protocolRepository.findByShareToken(token);
	if (!protocol) return null;

	const rows = await db
		.select({
			supplementName: supplements.name,
			supplementCategory: supplements.category,
			supplementStockUnit: supplements.stockUnit,
			timeBlockName: timeBlocks.name,
			timeBlockIcon: timeBlocks.icon,
			timeBlockStartTime: timeBlocks.startTime,
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			notes: supplementSchedules.notes,
			isCritical: supplementSchedules.isCritical,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes,
			waitAfterTakingMinutes: supplementSchedules.waitAfterTakingMinutes,
			sortOrder: supplementSchedules.sortOrder,
			finishPackage: supplementSchedules.finishPackage,
		})
		.from(supplementSchedules)
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
		.where(eq(supplementSchedules.protocolId, protocol.id))
		.orderBy(asc(timeBlocks.startTime), asc(supplementSchedules.sortOrder));

	const supplementMap = new Map<string, SharedProtocolData["supplements"][number]>();

	for (const row of rows) {
		if (!supplementMap.has(row.supplementName)) {
			supplementMap.set(row.supplementName, {
				name: row.supplementName,
				category: row.supplementCategory,
				stockUnit: row.supplementStockUnit,
				schedules: [],
			});
		}
		supplementMap.get(row.supplementName)!.schedules.push({
			timeBlockName: row.timeBlockName,
			timeBlockIcon: row.timeBlockIcon,
			timeBlockStartTime: row.timeBlockStartTime,
			dosageAmount: Number(row.dosageAmount),
			dosageUnit: row.dosageUnit,
			notes: row.notes,
			isCritical: row.isCritical,
			cycleDaysOn: row.cycleDaysOn,
			cycleDaysOff: row.cycleDaysOff,
			startDayOffset: row.startDayOffset,
			durationDays: row.durationDays,
			dosageIntervalMinutes: row.dosageIntervalMinutes,
			waitAfterTakingMinutes: row.waitAfterTakingMinutes,
			sortOrder: row.sortOrder,
			finishPackage: row.finishPackage,
		});
	}

	return {
		protocolName: protocol.name,
		supplements: [...supplementMap.values()],
	};
}
