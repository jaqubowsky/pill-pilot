import { eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { supplementSchedules, supplements as supplementsTable } from "@/shared/db/schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";
import { UploadStep } from "./components/upload-step";
import type { ActiveProtocolSummary } from "./types";

export async function ProtocolUploadPage({ userId }: { userId: string }) {
	const [timeBlocks, supplements, activeProtocols] = await Promise.all([
		timeBlockRepository.findByUserId(userId),
		supplementRepository.findByUserId(userId),
		protocolRepository.findActiveByUserId(userId),
	]);

	const activeProtocolSummaries: ActiveProtocolSummary[] = await Promise.all(
		activeProtocols.map(async (protocol) => {
			const rows = await db
				.selectDistinct({ name: supplementsTable.name })
				.from(supplementSchedules)
				.innerJoin(supplementsTable, eq(supplementSchedules.supplementId, supplementsTable.id))
				.where(eq(supplementSchedules.protocolId, protocol.id));

			return {
				name: protocol.name,
				supplements: rows.map((r) => r.name),
			};
		}),
	);

	return (
		<UploadStep
			supplements={supplements.map((s) => ({
				id: s.id,
				name: s.name,
				brandName: s.brandName,
			}))}
			timeBlocks={timeBlocks.map((tb) => ({
				id: tb.id,
				name: tb.name,
				startTime: tb.startTime,
			}))}
			activeProtocols={activeProtocolSummaries}
		/>
	);
}
