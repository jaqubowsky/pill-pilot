type CycleStatus =
	| { isCycling: false }
	| { isCycling: true; isOnPhase: boolean; daysRemaining: number };

export function getCycleStatus(
	protocolStartDate: string | null,
	cycleDaysOn: number | null,
	cycleDaysOff: number | null,
	currentDate: string,
	startDayOffset = 0,
): CycleStatus {
	if (protocolStartDate === null || cycleDaysOn === null || cycleDaysOff === null) {
		return { isCycling: false };
	}

	const start = new Date(protocolStartDate);
	const current = new Date(currentDate);
	const diffMs = current.getTime() - start.getTime();
	const daysSinceProtocol = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const daysSinceStart = daysSinceProtocol - startDayOffset;
	const cycleLength = cycleDaysOn + cycleDaysOff;

	if (daysSinceStart < 0) {
		return {
			isCycling: true,
			isOnPhase: true,
			daysRemaining: cycleDaysOn,
		};
	}

	const dayInCycle = daysSinceStart % cycleLength;

	if (dayInCycle < cycleDaysOn) {
		return {
			isCycling: true,
			isOnPhase: true,
			daysRemaining: cycleDaysOn - dayInCycle,
		};
	}

	return {
		isCycling: true,
		isOnPhase: false,
		daysRemaining: cycleLength - dayInCycle,
	};
}
