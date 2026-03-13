import { and, asc, eq } from "drizzle-orm";
import type { ParsedProtocol } from "@/features/onboarding/schemas/parsed-protocol-schema";
import { db } from "@/shared/db/client";
import {
	type DosageUnit,
	protocolSupplements,
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

	if (!protocol[0]) return null;

	const rows = await db
		.select({
			psId: protocolSupplements.id,
			supplementId: supplements.id,
			supplementName: supplements.name,
			brandName: supplements.brandName,
			category: supplements.category,
			isCritical: protocolSupplements.isCritical,
			notes: protocolSupplements.notes,
			cycleDaysOn: protocolSupplements.cycleDaysOn,
			cycleDaysOff: protocolSupplements.cycleDaysOff,
			prerequisiteId: protocolSupplements.prerequisiteId,
			delayDays: protocolSupplements.delayDays,
			sortOrder: protocolSupplements.sortOrder,
			scheduleId: supplementSchedules.id,
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			timeBlockId: supplementSchedules.timeBlockId,
		})
		.from(protocolSupplements)
		.innerJoin(supplements, eq(protocolSupplements.supplementId, supplements.id))
		.innerJoin(
			supplementSchedules,
			eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
		)
		.where(eq(protocolSupplements.protocolId, protocolId))
		.orderBy(asc(protocolSupplements.sortOrder));

	type SupplementEntry = {
		name: string;
		existingSupplementId: string | null;
		brandName: string | null;
		category: SupplementCategory;
		isCritical: boolean;
		notes: string | null;
		cycleDaysOn: number | null;
		cycleDaysOff: number | null;
		prerequisiteName: string | null;
		delayDays: number | null;
		confidence: number;
		schedules: { dosageAmount: number; dosageUnit: DosageUnit; timeBlockId: string }[];
		_prerequisiteId: string | null;
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
				prerequisiteName: null,
				delayDays: row.delayDays,
				confidence: 1.0,
				schedules: [],
				_prerequisiteId: row.prerequisiteId,
			});
		}

		supplementMap.get(row.supplementId)!.schedules.push({
			dosageAmount: Number(row.dosageAmount),
			dosageUnit: row.dosageUnit,
			timeBlockId: row.timeBlockId,
		});
	}

	const psIdToName = new Map<string, string>();
	for (const row of rows) {
		psIdToName.set(row.psId, row.supplementName);
	}
	for (const entry of supplementMap.values()) {
		if (entry._prerequisiteId) {
			entry.prerequisiteName = psIdToName.get(entry._prerequisiteId) ?? null;
		}
	}

	return {
		parsed: {
			protocolName: protocol[0].name,
			supplements: Array.from(supplementMap.values()).map(({ _prerequisiteId, ...rest }) => rest),
		},
		startDate: protocol[0].startDate,
	};
}
