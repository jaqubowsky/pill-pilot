import { useTranslations } from "next-intl";
import type { ActiveTimer } from "@/features/dashboard/lib/collect-timers";
import { formatRemainingTime } from "@/features/dashboard/lib/format-remaining-time";

type TimerSupplementRowProps = {
	timer: ActiveTimer;
};

export function TimerSupplementRow({ timer }: TimerSupplementRowProps) {
	const t = useTranslations("dashboard");

	const timeLeft = formatRemainingTime(timer.remainingMs);
	const labelKey = timer.type === "cooldown" ? "cooldownRemaining" : "waitRemaining";
	const label = t(labelKey, { time: timeLeft });

	return (
		<div className="flex flex-1 flex-col min-w-0">
			<span className="text-sm font-medium text-content truncate">{timer.supplementName}</span>
			<span className="text-xs text-content-faint">{label}</span>
		</div>
	);
}
