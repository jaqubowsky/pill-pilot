import { getCycleStatus } from "./cycling";
import { getPhaseStatus } from "./phase-status";

export type ScheduleFilterFields = {
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	protocolStartDate: string | null;
};

export function isScheduleActionable(schedule: ScheduleFilterFields, date: string): boolean {
	const phase = getPhaseStatus(
		schedule.startDayOffset,
		schedule.durationDays,
		schedule.protocolStartDate,
		date,
	);
	if (phase.isExpired) return false;
	if (phase.isPhased && !phase.isUnlocked) return false;

	const cycle = getCycleStatus(
		schedule.protocolStartDate,
		schedule.cycleDaysOn,
		schedule.cycleDaysOff,
		date,
		schedule.startDayOffset,
	);
	if (cycle.isCycling && !cycle.isOnPhase) return false;

	return true;
}

export function groupLogsByDate(logs: { scheduleId: string; date: string }[]) {
	const map = new Map<string, Set<string>>();
	for (const log of logs) {
		const set = map.get(log.date) ?? new Set<string>();
		set.add(log.scheduleId);
		map.set(log.date, set);
	}
	return map;
}
