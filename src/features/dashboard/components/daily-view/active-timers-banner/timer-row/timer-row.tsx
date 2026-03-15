"use client";

import { Minus, Plus } from "lucide-react";
import type { ActiveTimer } from "../use-active-timers-banner";
import { useTimerRow } from "./use-timer-row";

type TimerRowProps = {
	timer: ActiveTimer;
	date: string;
};

const btnClass =
	"flex items-center gap-0.5 px-sm py-xs rounded-lg text-xs font-medium text-content-faint hover:bg-surface-sunken active:bg-surface-sunken min-h-11 min-w-11";

export function TimerRow({ timer, date }: TimerRowProps) {
	const { label, skipLabel, canAdjust, handleAdjust, handleSkip } = useTimerRow({ timer, date });

	return (
		<div className="flex items-center gap-sm">
			<div className="flex flex-1 flex-col min-w-0">
				<span className="text-sm font-medium text-content truncate">{timer.supplementName}</span>
				<span className="text-xs text-content-faint">{label}</span>
			</div>
			<div className="flex items-center gap-xs shrink-0">
				{canAdjust && (
					<button type="button" onClick={() => handleAdjust(-15)} className={btnClass}>
						<Minus className="size-3.5" />
						<span>15m</span>
					</button>
				)}
				<button type="button" onClick={handleSkip} className={btnClass}>
					{skipLabel}
				</button>
				{canAdjust && (
					<button type="button" onClick={() => handleAdjust(15)} className={btnClass}>
						<Plus className="size-3.5" />
						<span>15m</span>
					</button>
				)}
			</div>
		</div>
	);
}
