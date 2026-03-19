"use client";

import { useQueryState } from "nuqs";
import { adjustTimer } from "@/features/dashboard/api/actions/adjust-timer";
import { skipCooldown } from "@/features/dashboard/api/actions/skip-cooldown";
import { skipWaitTimer } from "@/features/dashboard/api/actions/skip-wait-timer";
import { dashboardSearchParams } from "@/features/dashboard/search-params";
import type { ActiveTimer } from "@/features/dashboard/lib/collect-timers";

type Params = {
	timer: ActiveTimer;
};

export function useTimerRow({ timer }: Params) {
	const [date] = useQueryState("date", dashboardSearchParams.date);

	async function handleAdjust(minutes: number) {
		if (!timer.logId) return;
		await adjustTimer({ logId: timer.logId, adjustmentMinutes: minutes });
	}

	async function handleSkip() {
		if (timer.type === "cooldown" && timer.protocolId && timer.supplementId) {
			await skipCooldown({ protocolId: timer.protocolId, supplementId: timer.supplementId, date });
		} else if (timer.type === "wait" && timer.logId) {
			await skipWaitTimer({ logId: timer.logId });
		}
	}

	return {
		canAdjust: !!timer.logId,
		handleAdjust,
		handleSkip,
	};
}
