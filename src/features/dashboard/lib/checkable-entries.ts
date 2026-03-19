type CheckableFields = {
	scheduleId: string;
	isExpired: boolean;
	notStartedDays: number | null;
	phase: { isUnlocked: boolean } | null;
	cycling: { isOnPhase: boolean } | null;
	stockStatus: { currentStock: number } | null;
	finishPackage: boolean;
	cooldown: { remainingMs: number } | null;
	logId: string | null;
};

export function getCheckableEntries<T extends CheckableFields>(entries: T[]): T[] {
	return entries.filter((e) => {
		if (e.isExpired) return false;
		if (e.notStartedDays !== null && e.notStartedDays > 0) return false;
		if (e.phase !== null && !e.phase.isUnlocked) return false;
		if (e.cycling !== null && !e.cycling.isOnPhase) return false;
		if (e.stockStatus !== null && e.stockStatus.currentStock === 0 && !e.finishPackage)
			return false;
		if (e.cooldown !== null && e.cooldown.remainingMs > 0) return false;
		return true;
	});
}

export function getUncheckedIds(entries: CheckableFields[]): string[] {
	return getCheckableEntries(entries)
		.filter((e) => !e.logId)
		.map((e) => e.scheduleId);
}
