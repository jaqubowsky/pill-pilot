import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";

export type ActiveTimer = {
	scheduleId: string;
	supplementName: string;
	type: "cooldown" | "wait";
	remainingMs: number;
	logId: string | null;
	protocolId: string | null;
	supplementId: string | null;
};

export function collectTimers(entries: ScheduleEntry[]): ActiveTimer[] {
	const timers: ActiveTimer[] = [];
	const seenCooldowns = new Set<string>();

	for (const entry of entries) {
		if (!entry.cooldown && !entry.waitTimer) continue;

		if (entry.cooldown && entry.cooldown.remainingMs > 0) {
			const key = `${entry.protocolId}:${entry.supplementId}`;
			if (!seenCooldowns.has(key)) {
				seenCooldowns.add(key);
				timers.push({
					scheduleId: entry.scheduleId,
					supplementName: entry.supplementName,
					type: "cooldown",
					remainingMs: entry.cooldown.remainingMs,
					logId: entry.cooldown.logId,
					protocolId: entry.protocolId,
					supplementId: entry.supplementId,
				});
			}
		}

		if (entry.waitTimer && entry.waitTimer.remainingMs > 0) {
			timers.push({
				scheduleId: entry.scheduleId,
				supplementName: entry.supplementName,
				type: "wait",
				remainingMs: entry.waitTimer.remainingMs,
				logId: entry.logId,
				protocolId: null,
				supplementId: null,
			});
		}
	}

	return timers.sort((a, b) => a.remainingMs - b.remainingMs);
}
