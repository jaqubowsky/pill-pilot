export type SiblingLog = {
	takenAt: Date;
	timerAdjustmentMinutes: number | null;
	cooldownSkippedAt: Date | null;
};

export function isCooldownActive(
	siblingLogs: SiblingLog[],
	dosageIntervalMinutes: number,
	now: number,
): boolean {
	if (siblingLogs.length === 0) return false;

	const mostRecent = siblingLogs.reduce((latest, log) =>
		log.takenAt > latest.takenAt ? log : latest,
	);

	if (mostRecent.cooldownSkippedAt) return false;

	const intervalMs = dosageIntervalMinutes * 60 * 1000;
	const adjustmentMs = (mostRecent.timerAdjustmentMinutes ?? 0) * 60 * 1000;
	const expiresAt = mostRecent.takenAt.getTime() + intervalMs + adjustmentMs;

	return expiresAt > now;
}
