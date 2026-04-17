import { notFound } from "next/navigation";
import { getSupplementSummaries } from "./api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "./api/queries/get-time-block-summaries";
import { getSharedProtocol } from "./api/queries/get-shared-protocol";
import type { SharedScheduleData } from "./api/queries/get-shared-protocol";
import { matchShareSupplements } from "./api/services/build-share-ai-content";
import { toIdentifiedSupplements } from "./lib/supplement-serialization";
import type { ParsedSupplement } from "./schemas/parsed-protocol-schema";
import type { TimeBlockSummary } from "./types";
import { ImportProtocolForm } from "./components/import-protocol-form";
import type { ProtocolFormData } from "./components/protocol-form-base";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

type Props = {
	userId: string;
	token: string;
};

export async function ImportProtocolPage({ userId, token }: Props) {
	const [sharedProtocol, existingSupplements, recipientTimeBlocks] = await Promise.all([
		getSharedProtocol(token),
		getSupplementSummaries(userId),
		getTimeBlockSummaries(userId),
	]);

	if (!sharedProtocol) notFound();

	const sharedNames = sharedProtocol.supplements.map((s) => s.name);
	const matchedIds = await matchShareSupplements(sharedNames, existingSupplements);

	const timeBlocksToCreate: TimeBlockToCreate[] = [];

	function resolveTimeBlockId(schedule: SharedScheduleData): string {
		const match = recipientTimeBlocks.find(
			(tb) =>
				tb.name.toLowerCase() === schedule.timeBlockName.toLowerCase() &&
				tb.startTime === schedule.timeBlockStartTime,
		);
		if (match) return match.id;

		const existing = timeBlocksToCreate.find(
			(tb) => tb.name === schedule.timeBlockName && tb.startTime === schedule.timeBlockStartTime,
		);
		if (existing) return existing.tempId;

		const tempId = crypto.randomUUID();
		timeBlocksToCreate.push({
			tempId,
			name: schedule.timeBlockName,
			icon: schedule.timeBlockIcon,
			startTime: schedule.timeBlockStartTime,
		});
		return tempId;
	}

	const parsedSupplements: ParsedSupplement[] = sharedProtocol.supplements.map((s, i) => ({
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
			timeBlockId: resolveTimeBlockId(sch),
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

	const allTimeBlocks: TimeBlockSummary[] = [
		...recipientTimeBlocks,
		...timeBlocksToCreate.map((tb) => ({ id: tb.tempId, name: tb.name, startTime: tb.startTime })),
	];

	const initialData: ProtocolFormData = {
		name: sharedProtocol.protocolName,
		supplements: toIdentifiedSupplements(parsedSupplements),
	};

	return (
		<ImportProtocolForm
			shareToken={token}
			existingSupplements={existingSupplements}
			timeBlocks={allTimeBlocks}
			initialData={initialData}
			timeBlocksToCreate={timeBlocksToCreate}
		/>
	);
}
