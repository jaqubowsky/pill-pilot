type DependencyStatus =
	| { isDependent: false; isExpired: false }
	| { isDependent: true; isUnlocked: boolean; daysRemaining: number; isExpired: false }
	| { isDependent: false; isExpired: true };

export function getDependencyStatus(
	startDayOffset: number,
	durationDays: number | null,
	protocolStartDate: string | null,
	currentDate: string,
): DependencyStatus {
	if (protocolStartDate === null) {
		return { isDependent: false, isExpired: false };
	}

	const start = new Date(protocolStartDate);
	const current = new Date(currentDate);
	const diffMs = current.getTime() - start.getTime();
	const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (durationDays !== null) {
		const endDay = startDayOffset + durationDays;
		if (daysElapsed >= endDay) {
			return { isDependent: false, isExpired: true };
		}
	}

	if (startDayOffset === 0) {
		return { isDependent: false, isExpired: false };
	}

	const remaining = Math.max(0, startDayOffset - daysElapsed);

	return {
		isDependent: true,
		isUnlocked: daysElapsed >= startDayOffset,
		daysRemaining: remaining,
		isExpired: false,
	};
}
