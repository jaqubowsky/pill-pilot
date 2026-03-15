"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";

export type ActiveTimer = {
	scheduleId: string;
	supplementName: string;
	type: "cooldown" | "wait";
	remainingMs: number;
	logId: string | null;
	protocolSupplementId: string | null;
};

function collectTimers(entries: ScheduleEntry[]): ActiveTimer[] {
	const timers: ActiveTimer[] = [];

	for (const entry of entries) {
		if (entry.cooldown && entry.cooldown.remainingMs > 0) {
			timers.push({
				scheduleId: entry.scheduleId,
				supplementName: entry.supplementName,
				type: "cooldown",
				remainingMs: entry.cooldown.remainingMs,
				logId: null,
				protocolSupplementId: entry.protocolSupplementId ?? null,
			});
		}
		if (entry.waitTimer && entry.waitTimer.remainingMs > 0) {
			timers.push({
				scheduleId: entry.scheduleId,
				supplementName: entry.supplementName,
				type: "wait",
				remainingMs: entry.waitTimer.remainingMs,
				logId: entry.logId,
				protocolSupplementId: null,
			});
		}
	}

	return timers.sort((a, b) => a.remainingMs - b.remainingMs);
}

type Params = {
	allEntries: ScheduleEntry[];
};

export function useActiveTimersBanner({ allEntries }: Params) {
	const router = useRouter();
	const [expanded, setExpanded] = useState(false);
	const [tick, setTick] = useState(0);

	const timers = useMemo(() => collectTimers(allEntries), [allEntries]);

	useEffect(() => {
		if (timers.length === 0) return;

		const interval = setInterval(() => {
			setTick((prev) => prev + 1);
		}, 30_000);

		return () => clearInterval(interval);
	}, [timers.length]);

	useEffect(() => {
		if (tick === 0) return;

		const anyExpired = timers.some((t) => t.remainingMs - tick * 30_000 <= 0);
		if (anyExpired) {
			router.refresh();
		}
	}, [tick, timers, router]);

	const nearest = timers[0] ?? null;

	return {
		timers,
		nearest,
		expanded,
		toggleExpanded: () => setExpanded((prev) => !prev),
	};
}
