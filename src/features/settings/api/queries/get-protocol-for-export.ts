import { asc, eq } from "drizzle-orm";
import type { ProtocolForExportData } from "@/features/settings/api/services/protocol-export-model";
import { db } from "@/shared/db/client";
import { supplementSchedules, supplements, timeBlocks } from "@/shared/db/schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export async function getProtocolForExport(
	protocolId: string,
	userId: string,
): Promise<ProtocolForExportData> {
	const protocol = await protocolRepository.findByIdAndUserId(protocolId, userId);

	const scheduleRows = await db
		.select({
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			notes: supplementSchedules.notes,
			isCritical: supplementSchedules.isCritical,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			sortOrder: supplementSchedules.sortOrder,
			active: supplementSchedules.active,
			supplement: {
				name: supplements.name,
				brandName: supplements.brandName,
				category: supplements.category,
			},
			timeBlock: {
				name: timeBlocks.name,
				startTime: timeBlocks.startTime,
			},
		})
		.from(supplementSchedules)
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
		.where(eq(supplementSchedules.protocolId, protocolId))
		.orderBy(asc(timeBlocks.startTime), asc(supplementSchedules.sortOrder));

	return {
		name: protocol.name,
		status: protocol.status,
		startDate: protocol.startDate,
		schedules: scheduleRows,
	};
}
