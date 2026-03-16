"use client";

import { Hourglass, Lock, Repeat, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EditedSupplement } from "@/features/protocol-wizard/components/parsed-preview/parsed-preview.schema";
import { IconBadge } from "@/shared/components/icon-badge";
import { formatMinutes } from "@/shared/lib/format-minutes";
import type { IdentifiedSupplement } from "../use-parsed-preview";

type SupplementBadgesProps = {
	supplement: IdentifiedSupplement;
	schedule?: EditedSupplement["schedules"][number];
};

export function SupplementBadges({ supplement, schedule }: SupplementBadgesProps) {
	const t = useTranslations("schedule");

	const cycleDaysOn = schedule?.cycleDaysOn ?? supplement.cycleDaysOn;
	const cycleDaysOff = schedule?.cycleDaysOff ?? supplement.cycleDaysOff;
	const waitAfterTakingMinutes =
		schedule?.waitAfterTakingMinutes ?? supplement.waitAfterTakingMinutes;
	const startDayOffset = schedule?.startDayOffset ?? supplement.startDayOffset;
	const durationDays = schedule?.durationDays ?? supplement.durationDays;

	return (
		<>
			{cycleDaysOn && cycleDaysOff ? (
				<IconBadge
					icon={Repeat}
					label={t("cyclingLabel", {
						on: cycleDaysOn,
						off: cycleDaysOff,
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
			{waitAfterTakingMinutes ? (
				<IconBadge
					icon={Hourglass}
					variant="amber"
					label={t("waitAfterTakingBadge", {
						time: formatMinutes(waitAfterTakingMinutes),
					})}
				/>
			) : null}
			{(startDayOffset > 0 || durationDays) && (
				<IconBadge
					icon={Lock}
					variant="muted"
					label={
						startDayOffset > 0 && durationDays
							? t("dayRangeBadge", {
									from: startDayOffset,
									to: startDayOffset + durationDays,
								})
							: startDayOffset > 0
								? t("startDayOffsetBadge", { count: startDayOffset })
								: t("durationBadge", { count: durationDays! })
					}
				/>
			)}
		</>
	);
}
