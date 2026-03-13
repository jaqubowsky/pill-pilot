import { useTranslations } from "next-intl";

const CONFIDENCE_THRESHOLD = 0.7;

interface ConfidenceBadgeProps {
	confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
	const t = useTranslations("onboarding");

	if (confidence >= CONFIDENCE_THRESHOLD) return null;

	return (
		<span className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-warning-bg text-[#8B6914]">
			{t("badgeCheck")}
		</span>
	);
}
