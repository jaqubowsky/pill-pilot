"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { adjustTimer } from "@/features/dashboard/api/actions/adjust-timer";
import { skipCooldown } from "@/features/dashboard/api/actions/skip-cooldown";
import { formatRemainingTime } from "@/features/dashboard/lib/format-remaining-time";
import { Button } from "@/shared/components/ui/button";
import type { ActiveTimer } from "./use-active-timers-banner";

type TimerRowProps = {
	timer: ActiveTimer;
	date: string;
};

export function TimerRow({ timer, date }: TimerRowProps) {
	const t = useTranslations("dashboard");
	const { execute: executeAdjust } = useAction(adjustTimer);
	const { execute: executeSkip } = useAction(skipCooldown);

	const label =
		timer.type === "cooldown"
			? t("cooldownRemaining", { time: formatRemainingTime(timer.remainingMs) })
			: t("waitRemaining", { time: formatRemainingTime(timer.remainingMs) });

	return (
		<div className="flex items-center gap-sm">
			<div className="flex flex-1 flex-col min-w-0">
				<span className="text-sm font-medium text-content truncate">{timer.supplementName}</span>
				<span className="text-xs text-content-faint">{label}</span>
			</div>
			<div className="flex items-center gap-xs shrink-0">
				{timer.logId && (
					<>
						<button
							type="button"
							onClick={() => executeAdjust({ logId: timer.logId!, adjustmentMinutes: -15 })}
							className="p-xs rounded-md text-content-faint active:bg-surface-sunken"
						>
							<Minus className="size-3.5" />
						</button>
						<button
							type="button"
							onClick={() => executeAdjust({ logId: timer.logId!, adjustmentMinutes: 15 })}
							className="p-xs rounded-md text-content-faint active:bg-surface-sunken"
						>
							<Plus className="size-3.5" />
						</button>
					</>
				)}
				{timer.type === "cooldown" && timer.protocolSupplementId && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							executeSkip({
								protocolSupplementId: timer.protocolSupplementId!,
								date,
							})
						}
						className="text-xs h-7 px-sm"
					>
						{t("skipCooldown")}
					</Button>
				)}
			</div>
		</div>
	);
}
