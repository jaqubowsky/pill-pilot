type DependencyStatus =
	| { isDependent: false }
	| { isDependent: true; isUnlocked: boolean; daysRemaining: number; prerequisiteName: string };

export function getDependencyStatus(
	prerequisiteId: string | null,
	delayDays: number | null,
	protocolStartDate: string | null,
	currentDate: string,
	prerequisiteName: string,
): DependencyStatus {
	if (prerequisiteId === null || delayDays === null || protocolStartDate === null) {
		return { isDependent: false };
	}

	const start = new Date(protocolStartDate);
	const current = new Date(currentDate);
	const diffMs = current.getTime() - start.getTime();
	const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const remaining = Math.max(0, delayDays - daysElapsed);

	return {
		isDependent: true,
		isUnlocked: daysElapsed >= delayDays,
		daysRemaining: remaining,
		prerequisiteName,
	};
}

