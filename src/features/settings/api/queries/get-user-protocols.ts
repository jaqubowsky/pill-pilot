import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	type DosageUnit,
	ProtocolStatus,
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
					ProtocolStatus.processing,
					ProtocolStatus.failed,
					ProtocolStatus.draft,
					ProtocolStatus.active,
					ProtocolStatus.archived,
				]),
			),
		)
		.orderBy(
			sql`CASE WHEN ${protocols.status} = 'processing' THEN 0 WHEN ${protocols.status} = 'failed' THEN 1 WHEN ${protocols.status} = 'draft' THEN 2 WHEN ${protocols.status} = 'active' THEN 3 ELSE 4 END`,
		);

	const protocolIds = userProtocols
		.filter((p) => p.status !== "processing" && p.status !== "failed")
		.map((p) => p.id);

	const scheduleRows =
		protocolIds.length > 0
			? await db
					.select({
						protocolId: supplementSchedules.protocolId,
						id: supplementSchedules.id,
						dosageAmount: supplementSchedules.dosageAmount,
						dosageUnit: supplementSchedules.dosageUnit,
						notes: supplementSchedules.notes,
						active: supplementSchedules.active,
						sortOrder: supplementSchedules.sortOrder,
						cycleDaysOn: supplementSchedules.cycleDaysOn,
						cycleDaysOff: supplementSchedules.cycleDaysOff,
						supplement: {
							id: supplements.id,
							name: supplements.name,
							isCritical: supplementSchedules.isCritical,
						},
						timeBlock: {
							id: timeBlocks.id,
							name: timeBlocks.name,
							icon: timeBlocks.icon,
						},
						timeBlockStartTime: timeBlocks.startTime,
					})
					.from(supplementSchedules)
					.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
					.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
					.where(inArray(supplementSchedules.protocolId, protocolIds))
					.orderBy(asc(timeBlocks.startTime), asc(supplementSchedules.sortOrder))
			: [];

	const schedulesByProtocol = new Map<string, ProtocolWithSchedules["schedules"]>();
	for (const row of scheduleRows) {
		const list = schedulesByProtocol.get(row.protocolId) ?? [];
		list.push(row);
		schedulesByProtocol.set(row.protocolId, list);
	}

	return userProtocols.map((protocol) => ({
		id: protocol.id,
		name: protocol.name,
		status: protocol.status,
		schedules: schedulesByProtocol.get(protocol.id) ?? [],
	}));
}
