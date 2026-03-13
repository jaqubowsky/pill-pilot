import { useTranslations } from "next-intl";

interface SupplementLinkBadgeProps {
	existingSupplementId: string | null;
}

export function SupplementLinkBadge({ existingSupplementId }: SupplementLinkBadgeProps) {
	const t = useTranslations("onboarding");

	if (existingSupplementId) {
		return (
			<span className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-success-bg text-brand-700">
				{t("badgeLinked")}
			</span>
		);
	}

	return (
		<span className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-info-bg text-[#2D6070]">
			{t("badgeNew")}
		</span>
	);
}
