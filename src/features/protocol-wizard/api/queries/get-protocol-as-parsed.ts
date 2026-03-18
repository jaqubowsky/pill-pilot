import { and, asc, eq } from "drizzle-orm";
import type { ParsedProtocol } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { db } from "@/shared/db/client";
import {
	protocols,
	type SupplementCategory,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";

type ProtocolAsParsed = {
	parsed: ParsedProtocol;
	startDate: string | null;
};

export async function getProtocolAsParsed(
	protocolId: string,
	userId: string,
): Promise<ProtocolAsParsed | null> {
	const protocol = await db
		.select()
		.from(protocols)
		.where(and(eq(protocols.id, protocolId), eq(protocols.userId, userId)));

	if (!protocol[0] || !protocol[0].parsedData) return null;

	const rows = await db
		.select({
			supplementId: supplements.id,
			supplementName: supplements.name,
			brandName: supplements.brandName,
			category: supplements.category,
			isCritical: supplementSchedules.isCritical,
			notes: supplementSchedules.notes,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes,
			waitAfterTakingMinutes: supplementSchedules.waitAfterTakingMinutes,
			sortOrder: supplementSchedules.sortOrder,
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			timeBlockId: supplementSchedules.timeBlockId,
			finishPackage: supplementSchedules.finishPackage,
		})
		.from(supplementSchedules)
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.where(eq(supplementSchedules.protocolId, protocolId))
		.orderBy(asc(supplementSchedules.sortOrder));

	type ScheduleEntry = Pick<
		typeof supplementSchedules.$inferSelect,
		| "dosageUnit"
		| "timeBlockId"
		| "notes"
		| "isCritical"
		| "waitAfterTakingMinutes"
		| "cycleDaysOn"
		| "cycleDaysOff"
		| "startDayOffset"
		| "durationDays"
		| "finishPackage"
	> & { dosageAmount: number };

	type SupplementEntry = {
		name: string;
		existingSupplementId: string | null;
		brandName: string | null;
		category: SupplementCategory;
		isCritical: boolean;
		notes: string | null;
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		startDayOffset: number;
		durationDays: number | null;
		dosageIntervalMinutes: number | null;
		waitAfterTakingMinutes: number | null;
		confidence: number;
		uncertaintyReason: string | null;
		schedules: ScheduleEntry[];
	};

	const supplementMap = new Map<string, SupplementEntry>();

	for (const row of rows) {
		if (!supplementMap.has(row.supplementId)) {
			supplementMap.set(row.supplementId, {
				name: row.supplementName,
				existingSupplementId: row.supplementId,
				brandName: row.brandName,
				category: row.category,
				isCritical: row.isCritical,
				notes: row.notes,
				cycleDaysOn: row.cycleDaysOn,
				cycleDaysOff: row.cycleDaysOff,
				startDayOffset: row.startDayOffset,
				durationDays: row.durationDays,
				dosageIntervalMinutes: row.dosageIntervalMinutes,
				waitAfterTakingMinutes: row.waitAfterTakingMinutes,
				confidence: 1.0,
				uncertaintyReason: null,
				schedules: [],
			});
		}

		supplementMap.get(row.supplementId)!.schedules.push({
			dosageAmount: Number(row.dosageAmount),
			dosageUnit: row.dosageUnit,
			timeBlockId: row.timeBlockId,
			notes: row.notes,
			isCritical: row.isCritical,
			waitAfterTakingMinutes: row.waitAfterTakingMinutes,
			cycleDaysOn: row.cycleDaysOn,
			cycleDaysOff: row.cycleDaysOff,
			startDayOffset: row.startDayOffset,
			durationDays: row.durationDays,
			finishPackage: row.finishPackage,
		});
	}

	return {
		parsed: {
			protocolName: protocol[0].name,
			supplements: Array.from(supplementMap.values()),
		},
		startDate: protocol[0].startDate,
	};
}
