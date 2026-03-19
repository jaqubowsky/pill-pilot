"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";
import { collectTimers } from "@/features/dashboard/lib/collect-timers";

type Params = {
	allEntries: ScheduleEntry[];
};

export function useActiveTimersBanner({ allEntries }: Params) {
	const router = useRouter();
	const [expanded, setExpanded] = useState(false);
	const [elapsedMs, setElapsedMs] = useState(0);
	const startRef = useRef(Date.now());

	const baseTimers = useMemo(() => collectTimers(allEntries), [allEntries]);

	const refreshedRef = useRef(false);

	useEffect(() => {
		startRef.current = Date.now();
		setElapsedMs(0);
		refreshedRef.current = false;

		if (baseTimers.length === 0) return;

		const interval = setInterval(() => {
			setElapsedMs(Date.now() - startRef.current);
		}, 1_000);

		return () => clearInterval(interval);
	}, [baseTimers]);

	const timers = useMemo(() => {
		return baseTimers
			.map((t) => ({ ...t, remainingMs: Math.max(0, t.remainingMs - elapsedMs) }))
			.filter((t) => t.remainingMs > 0)
			.sort((a, b) => a.remainingMs - b.remainingMs);
	}, [baseTimers, elapsedMs]);

	useEffect(() => {
		if (baseTimers.length === 0) return;
		if (refreshedRef.current) return;
		if (baseTimers.some((t) => t.remainingMs - elapsedMs <= 0)) {
			refreshedRef.current = true;
			router.refresh();
		}
	}, [elapsedMs, baseTimers, router]);

	return {
		timers,
		nearest: timers[0] ?? null,
		expanded,
		toggleExpanded: () => setExpanded((prev) => !prev),
	};
}
