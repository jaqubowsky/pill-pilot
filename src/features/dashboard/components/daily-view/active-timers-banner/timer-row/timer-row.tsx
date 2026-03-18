"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ActiveTimer } from "../use-active-timers-banner";
import { TimerButton } from "./timer-button";
import { TimerSupplementRow } from "./timer-supplement-row";
import { useTimerRow } from "./use-timer-row";

type Props = {
	timer: ActiveTimer;
};

export function TimerRow({ timer }: Props) {
	const t = useTranslations("dashboard");
	const { canAdjust, handleAdjust, handleSkip } = useTimerRow({ timer });

	return (
		<div className="flex items-center gap-sm">
			<TimerSupplementRow timer={timer} />

			<div className="flex items-center gap-xs shrink-0">
				{canAdjust && (
					<TimerButton onClick={() => handleAdjust(-15)}>
						<Minus className="size-3.5" />
						<span>15m</span>
					</TimerButton>
				)}
				<TimerButton onClick={handleSkip}>{t("skipCooldown")}</TimerButton>
				{canAdjust && (
					<TimerButton onClick={() => handleAdjust(15)}>
						<Plus className="size-3.5" />
						<span>15m</span>
					</TimerButton>
				)}
			</div>
		</div>
	);
}
