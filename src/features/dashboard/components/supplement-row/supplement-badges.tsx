import type { LucideIcon } from "lucide-react";
import {
	AlertTriangle,
	CheckCircle,
	Hourglass,
	Lock,
	PackageCheck,
	Repeat,
	ShieldAlert,
	Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ScheduleEntry } from "@/features/dashboard/api/queries/get-daily-status";
import { IconBadge } from "@/shared/components/icon-badge";
import { formatMinutes } from "@/shared/lib/format-time";
import { formatRemainingTime } from "../../lib/format-remaining-time";

type BadgeDef = {
	key: string;
	when: boolean;
	icon: LucideIcon;
	variant?: "default" | "brand" | "amber" | "danger";
	label: string;
};

type Props = {
	entry: ScheduleEntry;
};

export function SupplementBadges({ entry }: Props) {
	const t = useTranslations("dashboard");
	const ts = useTranslations("schedule");

	const { cycling, phase, stockStatus, cooldown, waitTimer } = entry;

	const finishPackageCount =
		entry.durationDays && entry.packageSize && entry.totalDailyDosage > 0
			? Math.round((entry.durationDays * entry.totalDailyDosage) / entry.packageSize)
			: null;

	const lowStockLabel = stockStatus
		? t("lowStock", {
				count: stockStatus.currentStock,
				unit: t(`units.${stockStatus.stockUnit}`),
			})
		: "";

	const isNotStarted = entry.notStartedDays !== null && entry.notStartedDays > 0;
	const isLocked = phase !== null && !phase.isUnlocked;
	const isCooldownActive = cooldown !== null && cooldown.remainingMs > 0;
	const hasWaitTimer = waitTimer !== null && waitTimer.remainingMs > 0;

	const badges: BadgeDef[] = [
		{
			key: "expired",
			when: entry.isExpired,
			icon: CheckCircle,
			label: t("expired"),
		},
		{
			key: "locked",
			when: !entry.isExpired && (isNotStarted || isLocked),
			icon: Lock,
			label: isNotStarted
				? t("notStarted", { count: entry.notStartedDays ?? 0 })
				: t("phaseLocked", { count: phase?.daysRemaining ?? 0 }),
		},
		{
			key: "outOfStock",
			when: stockStatus !== null && stockStatus.currentStock === 0 && !entry.finishPackage,
			icon: AlertTriangle,
			variant: "danger",
			label: t("outOfStock"),
		},
		{
			key: "lowStock",
			when:
				stockStatus !== null &&
				stockStatus.currentStock > 0 &&
				stockStatus.daysRemaining < 7 &&
				!entry.finishPackage,
			icon: AlertTriangle,
			variant: "amber",
			label: lowStockLabel,
		},
		{
			key: "critical",
			when: entry.isCritical,
			icon: ShieldAlert,
			variant: "danger",
			label: t("critical"),
		},
		{
			key: "finishPackage",
			when: entry.finishPackage,
			icon: PackageCheck,
			label: finishPackageCount
				? ts("finishPackageCountBadge", { count: finishPackageCount })
				: ts("finishPackageBadge"),
		},
		{
			key: "cyclingOff",
			when: cycling?.isOnPhase === false,
			icon: Repeat,
			label: t("daysUntilResume", { count: cycling?.daysRemaining ?? 0 }),
		},
		{
			key: "cyclingOn",
			when: cycling?.isOnPhase === true,
			icon: Repeat,
			label: t("daysUntilPause", { count: cycling?.daysRemaining ?? 0 }),
		},
		{
			key: "cooldown",
			when: isCooldownActive,
			icon: Timer,
			variant: "brand",
			label: t("cooldownRemaining", {
				time: formatRemainingTime(cooldown?.remainingMs ?? 0),
			}),
		},
		{
			key: "wait",
			when: hasWaitTimer,
			icon: Hourglass,
			variant: "amber",
			label: t("waitRemaining", {
				time: formatRemainingTime(waitTimer?.remainingMs ?? 0),
			}),
		},
		{
			key: "interval",
			when: !isCooldownActive && !hasWaitTimer && !!entry.dosageIntervalMinutes,
			icon: Timer,
			variant: "brand",
			label: ts("dosageIntervalBadge", {
				time: formatMinutes(entry.dosageIntervalMinutes ?? 0),
			}),
		},
		{
			key: "waitAfter",
			when: !hasWaitTimer && !!entry.waitAfterTakingMinutes,
			icon: Hourglass,
			variant: "amber",
			label: ts("waitAfterTakingBadge", {
				time: formatMinutes(entry.waitAfterTakingMinutes ?? 0),
			}),
		},
	];

	return (
		<>
			{badges
				.filter((b) => b.when)
				.map((badge) => (
					<IconBadge
						key={badge.key}
						icon={badge.icon}
						variant={badge.variant}
						label={badge.label}
					/>
				))}
		</>
	);
}
