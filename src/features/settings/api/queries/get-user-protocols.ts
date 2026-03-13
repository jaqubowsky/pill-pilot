import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	type DosageUnit,
	ProtocolStatus,
	protocolSupplements,
	protocols,
	supplementSchedules,
	supplements,
	timeBlocks,
} from "@/shared/db/schema";

export type ProtocolWithSchedules = {
	id: string;
	name: string;
	status: ProtocolStatus;
	schedules: {
		id: string;
		protocolSupplementId: string;
		dosageAmount: string;
		dosageUnit: DosageUnit;
		notes: string | null;
		active: boolean;
		sortOrder: number;
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		supplement: {
			id: string;
			name: string;
			isCritical: boolean;
		};
		timeBlock: {
			id: string;
			name: string;
			icon: string;
		};
	}[];
};

export async function getUserProtocols(userId: string): Promise<ProtocolWithSchedules[]> {
	const userProtocols = await db
		.select()
		.from(protocols)
		.where(
			and(
				eq(protocols.userId, userId),
				inArray(protocols.status, [
					ProtocolStatus.draft,
					ProtocolStatus.active,
					ProtocolStatus.archived,
				]),
			),
		)
		.orderBy(
			sql`CASE WHEN ${protocols.status} = 'draft' THEN 0 WHEN ${protocols.status} = 'active' THEN 1 ELSE 2 END`,
		);

	const result: ProtocolWithSchedules[] = [];

	for (const protocol of userProtocols) {
		const scheduleRows = await db
			.select({
				id: supplementSchedules.id,
				protocolSupplementId: protocolSupplements.id,
				dosageAmount: supplementSchedules.dosageAmount,
				dosageUnit: supplementSchedules.dosageUnit,
				notes: protocolSupplements.notes,
				active: protocolSupplements.active,
				sortOrder: protocolSupplements.sortOrder,
				cycleDaysOn: protocolSupplements.cycleDaysOn,
				cycleDaysOff: protocolSupplements.cycleDaysOff,
				supplement: {
					id: supplements.id,
					name: supplements.name,
					isCritical: protocolSupplements.isCritical,
				},
				timeBlock: {
					id: timeBlocks.id,
					name: timeBlocks.name,
					icon: timeBlocks.icon,
				},
			})
			.from(supplementSchedules)
			.innerJoin(
				protocolSupplements,
				eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
			)
			.innerJoin(supplements, eq(protocolSupplements.supplementId, supplements.id))
			.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
			.where(eq(protocolSupplements.protocolId, protocol.id))
			.orderBy(asc(timeBlocks.sortOrder), asc(protocolSupplements.sortOrder));

		result.push({
			id: protocol.id,
			name: protocol.name,
			status: protocol.status,
			schedules: scheduleRows,
		});
	}

	return result;
}
