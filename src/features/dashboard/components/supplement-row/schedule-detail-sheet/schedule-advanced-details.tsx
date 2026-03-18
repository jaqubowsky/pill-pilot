import { useTranslations } from "next-intl";
import { formatMinutes } from "@/shared/lib/format-minutes";
import { DetailRow, type DetailRowDef } from "./detail-row";

type Props = {
	cycleDaysOn?: number | null;
	cycleDaysOff?: number | null;
	startDayOffset: number;
	durationDays?: number | null;
	dosageIntervalMinutes?: number | null;
	waitAfterTakingMinutes?: number | null;
};

export function ScheduleAdvancedDetails({
	cycleDaysOn,
	cycleDaysOff,
	startDayOffset,
	durationDays,
	dosageIntervalMinutes,
	waitAfterTakingMinutes,
}: Props) {
	const t = useTranslations("schedule");

	const rows: DetailRowDef[] = [
		cycleDaysOn != null && cycleDaysOff != null
			? {
					key: "cycling",
					label: t("cycling"),
					value: t("cyclingLabel", { on: cycleDaysOn, off: cycleDaysOff }),
				}
			: null,
		startDayOffset > 0
			? {
					key: "offset",
					label: t("delayedStart"),
					value: t("startDayOffsetBadge", { count: startDayOffset }),
				}
			: null,
		durationDays != null
			? {
					key: "duration",
					label: t("limitedDuration"),
					value: t("durationBadge", { count: durationDays }),
				}
			: null,
		dosageIntervalMinutes != null
			? { key: "interval", label: t("dosageInterval"), value: formatMinutes(dosageIntervalMinutes) }
			: null,
		waitAfterTakingMinutes != null
			? { key: "wait", label: t("waitAfterTaking"), value: formatMinutes(waitAfterTakingMinutes) }
			: null,
	].filter((row): row is DetailRowDef => row !== null);

	if (rows.length === 0) return null;

	return (
		<div className="flex flex-col border-t border-edge-subtle pt-md">
			{rows.map((row) => (
				<DetailRow key={row.key} label={row.label} value={row.value} />
			))}
		</div>
	);
}
