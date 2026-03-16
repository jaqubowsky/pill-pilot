"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { adjustTimer } from "@/features/dashboard/api/actions/adjust-timer";
import { skipCooldown } from "@/features/dashboard/api/actions/skip-cooldown";
import { skipWaitTimer } from "@/features/dashboard/api/actions/skip-wait-timer";
import { formatRemainingTime } from "@/features/dashboard/lib/format-remaining-time";
import type { ActiveTimer } from "../use-active-timers-banner";

type Params = {
	timer: ActiveTimer;
	date: string;
};

export function useTimerRow({ timer, date }: Params) {
	const t = useTranslations("dashboard");
	const { execute: executeAdjust } = useAction(adjustTimer);
	const { execute: executeSkipCooldown } = useAction(skipCooldown);
	const { execute: executeSkipWait } = useAction(skipWaitTimer);

	const label =
		timer.type === "cooldown"
			? t("cooldownRemaining", { time: formatRemainingTime(timer.remainingMs) })
			: t("waitRemaining", { time: formatRemainingTime(timer.remainingMs) });

	function handleAdjust(minutes: number) {
		if (timer.logId) {
			executeAdjust({ logId: timer.logId, adjustmentMinutes: minutes });
		}
	}

	function handleSkip() {
		if (timer.type === "cooldown" && timer.protocolId && timer.supplementId) {
			executeSkipCooldown({ protocolId: timer.protocolId, supplementId: timer.supplementId, date });
		} else if (timer.type === "wait" && timer.logId) {
			executeSkipWait({ logId: timer.logId });
		}
	}

	return {
		label,
		skipLabel: t("skipCooldown"),
		canAdjust: !!timer.logId,
		handleAdjust,
		handleSkip,
	};
}
