"use client";

import { useTranslations } from "next-intl";
import { ProgressRingIcon } from "./progress-ring-icon";
import { useProgressRing } from "./use-progress-ring";

type Props = {
	completed: number;
	total: number;
};

const SIZE = 80;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;

export function ProgressRing({ completed, total }: Props) {
	const t = useTranslations("dashboard");
	const { percent, offset, circumference } = useProgressRing(completed, total);

	return (
		<div className="flex flex-col items-center gap-xs">
			<div className="relative" style={{ width: SIZE, height: SIZE }}>
				<ProgressRingIcon
					size={SIZE}
					stroke={STROKE}
					radius={RADIUS}
					circumference={circumference}
					offset={offset}
				/>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-lg font-semibold text-content">{percent}%</span>
				</div>
			</div>
			<span className="text-sm text-content-muted">{t("progressLabel", { completed, total })}</span>
		</div>
	);
}
