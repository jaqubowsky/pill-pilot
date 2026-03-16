type ItemLevel = {
	notes?: string | null;
	isCritical: boolean;
	cycleDaysOn?: number | null;
	cycleDaysOff?: number | null;
	startDayOffset?: number | null;
	durationDays?: number | null;
	dosageIntervalMinutes?: number | null;
	waitAfterTakingMinutes?: number | null;
};

type ScheduleLevel = {
	notes?: string | null;
	isCritical?: boolean | null;
	cycleDaysOn?: number | null;
	cycleDaysOff?: number | null;
	startDayOffset?: number | null;
	durationDays?: number | null;
	waitAfterTakingMinutes?: number | null;
};

type ResolvedScheduleFields = {
	notes: string | null;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	dosageIntervalMinutes: number | null;
	waitAfterTakingMinutes: number | null;
};

export function resolveScheduleFields(
	schedule: ScheduleLevel,
	item: ItemLevel,
): ResolvedScheduleFields {
	const cycleDaysOn = schedule.cycleDaysOn ?? item.cycleDaysOn ?? null;
	const cycleDaysOff = schedule.cycleDaysOff ?? item.cycleDaysOff ?? null;
	const hasCycling = cycleDaysOn !== null && cycleDaysOff !== null;

	return {
		notes: schedule.notes ?? item.notes ?? null,
		isCritical: schedule.isCritical ?? item.isCritical,
		startDayOffset: schedule.startDayOffset ?? item.startDayOffset ?? 0,
		durationDays: schedule.durationDays ?? item.durationDays ?? null,
		dosageIntervalMinutes: item.dosageIntervalMinutes ?? null,
		waitAfterTakingMinutes: schedule.waitAfterTakingMinutes ?? item.waitAfterTakingMinutes ?? null,
		cycleDaysOn: hasCycling ? cycleDaysOn : null,
		cycleDaysOff: hasCycling ? cycleDaysOff : null,
	};
}
