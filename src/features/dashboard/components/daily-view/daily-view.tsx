"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DailyStatus } from "@/features/dashboard/api/queries/get-daily-status";
import { TimeBlock } from "@/features/dashboard/components/time-block";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DateNavigator } from "./date-navigator";
import { ProgressRing } from "./progress-ring";
import { useDailyView } from "./use-daily-view";

type Props = {
	status: DailyStatus;
	date: string;
	activeBlockIndex: number;
	hasProcessing?: boolean;
	hasDraft?: boolean;
};

export function DailyView({ status, date, activeBlockIndex, hasProcessing, hasDraft }: Props) {
	const t = useTranslations();
	const { parsedDate, isEmpty, goToPrevDay, goToNextDay, refresh } = useDailyView({
		date,
		status,
	});

	return (
		<div className="flex flex-col gap-lg px-md pt-2xl pb-3xl">
			{hasProcessing && !isEmpty && (
				<Link
					href="/settings"
					className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-md py-sm"
				>
					<span className="text-sm font-medium text-brand-700">
						{t("dashboard.processingBanner")}
					</span>
					<span className="text-sm font-semibold text-brand-600">
						{t("dashboard.processingBannerLink")} &rarr;
					</span>
				</Link>
			)}

			<DateNavigator date={parsedDate} onPrev={goToPrevDay} onNext={goToNextDay} />

			{!isEmpty && (
				<div className="flex justify-center">
					<ProgressRing completed={status.completedCount} total={status.totalSchedules} />
				</div>
			)}

			{isEmpty ? (
				<DashboardEmptyState hasDraft={hasDraft} hasProcessing={hasProcessing} />
			) : (
				<div className="flex flex-col gap-sm">
					{status.timeBlocks.map((block, index) => (
						<TimeBlock
							key={block.blockId}
							block={block}
							date={date}
							defaultOpen={index === activeBlockIndex}
							protocolColors={status.protocolColors}
							onCheckChange={refresh}
						/>
					))}
				</div>
			)}
		</div>
	);
}
