type PhaseStatus =
	| { isPhased: false; isExpired: false }
	| { isPhased: true; isUnlocked: boolean; daysRemaining: number; isExpired: false }
	| { isPhased: false; isExpired: true };

export function getPhaseStatus(
	startDayOffset: number,
	durationDays: number | null,
	protocolStartDate: string | null,
	currentDate: string,
): PhaseStatus {
	if (protocolStartDate === null) {
		return { isPhased: false, isExpired: false };
	}

	const start = new Date(protocolStartDate);
	const current = new Date(currentDate);
	const diffMs = current.getTime() - start.getTime();
	const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (durationDays !== null) {
		const endDay = startDayOffset + durationDays;
		if (daysElapsed >= endDay) {
			return { isPhased: false, isExpired: true };
		}
	}

	if (startDayOffset === 0) {
		return { isPhased: false, isExpired: false };
	}

	const remaining = Math.max(0, startDayOffset - daysElapsed);

	return {
		isPhased: true,
		isUnlocked: daysElapsed >= startDayOffset,
		daysRemaining: remaining,
		isExpired: false,
	};
}
