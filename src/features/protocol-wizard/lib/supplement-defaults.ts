import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import type { EditedSupplement } from "../components/protocol-base/parsed-preview.schema";
import type { ExistingSupplementSummary } from "../types";

export function findPackageSize(
	existingSupplementId: string | null,
	existingSupplements: ExistingSupplementSummary[],
): number | null {
	if (!existingSupplementId) return null;
	return existingSupplements.find((s) => s.id === existingSupplementId)?.packageSize ?? null;
}

export function findScheduleIndex(
	schedules: { timeBlockId: string }[],
	timeBlockId: string,
): number {
	return schedules.findIndex((s) => s.timeBlockId === timeBlockId);
}

export function getTotalDailyDosage(schedules: { dosageAmount: number }[]): number {
	return schedules.reduce((sum, s) => sum + s.dosageAmount, 0);
}

export function buildDefaultSupplement(timeBlockId: string): EditedSupplement {
	return {
		name: "",
		existingSupplementId: null,
		brandName: null,
		category: SupplementCategory.supplement,
		isCritical: false,
		notes: null,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: null,
		waitAfterTakingMinutes: null,
		confidence: 1,
		uncertaintyReason: null,
		schedules: [
			{
				dosageAmount: 1,
				dosageUnit: DosageUnit.capsule,
				timeBlockId,
				notes: null,
				isCritical: false,
				waitAfterTakingMinutes: null,
				cycleDaysOn: null,
				cycleDaysOff: null,
				startDayOffset: 0,
				durationDays: null,
			},
		],
	};
}
