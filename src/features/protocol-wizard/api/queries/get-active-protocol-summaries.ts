import { eq, inArray } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { supplementSchedules, supplements as supplementsTable } from "@/shared/db/schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import type { ActiveProtocolSummary } from "../../types";

export async function getActiveProtocolSummaries(userId: string): Promise<ActiveProtocolSummary[]> {
	const activeProtocols = await protocolRepository.findActiveByUserId(userId);

	if (activeProtocols.length === 0) return [];

	const protocolIds = activeProtocols.map((p) => p.id);
	const rows = await db
		.selectDistinct({
			protocolId: supplementSchedules.protocolId,
			name: supplementsTable.name,
		})
		.from(supplementSchedules)
		.innerJoin(supplementsTable, eq(supplementSchedules.supplementId, supplementsTable.id))
		.where(inArray(supplementSchedules.protocolId, protocolIds));

	const namesByProtocol = new Map<string, string[]>();
	for (const row of rows) {
		const list = namesByProtocol.get(row.protocolId) ?? [];
		list.push(row.name);
		namesByProtocol.set(row.protocolId, list);
	}

	return activeProtocols.map((protocol) => ({
		name: protocol.name,
		supplements: namesByProtocol.get(protocol.id) ?? [],
	}));
}
