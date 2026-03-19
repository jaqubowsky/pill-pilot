import type { z } from "zod";
import type { parsedProtocolSchema } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";
import { supplementRepository } from "@/shared/repositories/supplement-repository";
import { resolveScheduleFields } from "./resolve-schedule-fields";

type ParsedProtocol = z.infer<typeof parsedProtocolSchema>;
type ParsedSupplement = ParsedProtocol["supplements"][number];

export type ResolvedSupplement = {
	supplementId: string;
	isNew: boolean;
};

export async function resolveSupplements(
	supplements: ParsedSupplement[],
	userId: string,
): Promise<Record<string, ResolvedSupplement>> {
	const result: Record<string, ResolvedSupplement> = {};

	for (const item of supplements) {
		if (item.existingSupplementId) {
			await supplementRepository.findByIdAndUserId(item.existingSupplementId, userId);
			result[item.name] = { supplementId: item.existingSupplementId, isNew: false };
		} else {
			const created = await supplementRepository.create({
				userId,
				name: item.name,
				brandName: item.brandName ?? null,
				category: item.category,
				stockUnit: item.schedules[0]?.dosageUnit ?? "capsule",
			});
			result[item.name] = { supplementId: created.id, isNew: true };
		}
	}

	return result;
}

export type ScheduleData = {
	protocolId: string;
	supplementId: string;
	timeBlockId: string;
	dosageAmount: string;
	dosageUnit: string;
	sortOrder: number;
	notes: string | null;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	dosageIntervalMinutes: number | null;
	waitAfterTakingMinutes: number | null;
	finishPackage: boolean;
};

export function buildScheduleDataList(
	supplements: ParsedSupplement[],
	supplementMap: Record<string, ResolvedSupplement>,
	protocolId: string,
	validTimeBlockIds: Set<string>,
): ScheduleData[] {
	const schedules: ScheduleData[] = [];
	let sortOrder = 0;

	for (const item of supplements) {
		const supplementId = supplementMap[item.name].supplementId;

		for (const schedule of item.schedules) {
			if (!validTimeBlockIds.has(schedule.timeBlockId)) {
				throw new ActionError(ActionErrorCode.TIME_BLOCK_NOT_FOUND);
			}

			const resolved = resolveScheduleFields(schedule, item);

			schedules.push({
				protocolId,
				supplementId,
				timeBlockId: schedule.timeBlockId,
				dosageAmount: String(schedule.dosageAmount),
				dosageUnit: schedule.dosageUnit,
				sortOrder: sortOrder++,
				...resolved,
			});
		}
	}

	return schedules;
}
