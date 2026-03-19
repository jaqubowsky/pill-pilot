import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { ProtocolStatus, protocols, supplementSchedules } from "@/shared/db/schema";
import type { ScheduleConsumption } from "@/shared/lib/stock-forecast";

export async function getActiveSchedulesForSupplement(
	supplementId: string,
): Promise<ScheduleConsumption[]> {
	const rows = await db
		.select({
			dosageAmount: supplementSchedules.dosageAmount,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			protocolStartDate: protocols.startDate,
		})
		.from(supplementSchedules)
		.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.where(
			and(
				eq(supplementSchedules.supplementId, supplementId),
				eq(supplementSchedules.active, true),
				eq(protocols.status, ProtocolStatus.active),
			),
		);

	return rows.map((s) => ({
		dosageAmount: parseFloat(s.dosageAmount),
		cycleDaysOn: s.cycleDaysOn,
		cycleDaysOff: s.cycleDaysOff,
		startDayOffset: s.startDayOffset,
		durationDays: s.durationDays,
		protocolStartDate: s.protocolStartDate,
	}));
}
