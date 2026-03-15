"use client";

import { Hourglass, Lock, Repeat, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconBadge } from "@/shared/components/icon-badge";
import { formatMinutes } from "@/shared/lib/format-minutes";
import type { IdentifiedSupplement } from "../use-parsed-preview";

type SupplementBadgesProps = {
	supplement: IdentifiedSupplement;
};

export function SupplementBadges({ supplement }: SupplementBadgesProps) {
	const t = useTranslations("schedule");

	return (
		<>
			{supplement.cycleDaysOn && supplement.cycleDaysOff ? (
				<IconBadge
					icon={Repeat}
					label={t("cyclingLabel", {
						on: supplement.cycleDaysOn,
						off: supplement.cycleDaysOff,
					})}
				/>
			) : null}
			{supplement.dosageIntervalMinutes ? (
				<IconBadge
					icon={Timer}
					variant="brand"
					label={t("dosageIntervalBadge", {
						time: formatMinutes(supplement.dosageIntervalMinutes),
					})}
				/>
			) : null}
			{supplement.waitAfterTakingMinutes ? (
				<IconBadge
					icon={Hourglass}
					variant="amber"
					label={t("waitAfterTakingBadge", {
						time: formatMinutes(supplement.waitAfterTakingMinutes),
					})}
				/>
			) : null}
			{(supplement.startDayOffset > 0 || supplement.durationDays) && (
				<IconBadge
					icon={Lock}
					variant="muted"
					label={
						supplement.startDayOffset > 0 && supplement.durationDays
							? t("dayRangeBadge", {
									from: supplement.startDayOffset,
									to: supplement.startDayOffset + supplement.durationDays,
								})
							: supplement.startDayOffset > 0
								? t("startDayOffsetBadge", { count: supplement.startDayOffset })
								: t("durationBadge", { count: supplement.durationDays! })
					}
				/>
			)}
		</>
	);
}
