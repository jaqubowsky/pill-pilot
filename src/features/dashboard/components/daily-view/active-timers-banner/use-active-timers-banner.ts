"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

function collectTimers(entries: ScheduleEntry[]): ActiveTimer[] {
	const timers: ActiveTimer[] = [];
	const seenCooldowns = new Set<string>();

	for (const entry of entries) {
		if (entry.cooldown && entry.cooldown.remainingMs > 0) {
			const key = `${entry.protocolId}:${entry.supplementId}`;
			if (seenCooldowns.has(key)) continue;
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

type Params = {
	allEntries: ScheduleEntry[];
};

export function useActiveTimersBanner({ allEntries }: Params) {
	const router = useRouter();
	const [expanded, setExpanded] = useState(false);
	const [elapsedMs, setElapsedMs] = useState(0);
	const startRef = useRef(Date.now());

	const baseTimers = useMemo(() => {
		startRef.current = Date.now();
		setElapsedMs(0);
		return collectTimers(allEntries);
	}, [allEntries]);

	useEffect(() => {
		if (baseTimers.length === 0) return;

		const interval = setInterval(() => {
			setElapsedMs(Date.now() - startRef.current);
		}, 1_000);

		return () => clearInterval(interval);
	}, [baseTimers]);

	const timers = useMemo(() => {
		const live = baseTimers
			.map((t) => ({
				...t,
				remainingMs: Math.max(0, t.remainingMs - elapsedMs),
			}))
			.filter((t) => t.remainingMs > 0);

		return live.sort((a, b) => a.remainingMs - b.remainingMs);
	}, [baseTimers, elapsedMs]);

	useEffect(() => {
		if (baseTimers.length === 0) return;
		const anyExpired = baseTimers.some((t) => t.remainingMs - elapsedMs <= 0);
		if (anyExpired) {
			router.refresh();
		}
	}, [elapsedMs, baseTimers, router]);

	const nearest = timers[0] ?? null;

	return {
		timers,
		nearest,
		expanded,
		toggleExpanded: () => setExpanded((prev) => !prev),
	};
}
