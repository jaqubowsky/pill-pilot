import Link from "next/link";
import { useTranslations } from "next-intl";

export function ProcessingBanner() {
	const t = useTranslations("dashboard");

	return (
		<Link
			href="/settings"
			className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-md py-sm"
		>
			<span className="text-sm font-medium text-brand-700">{t("processingBanner")}</span>
			<span className="text-sm font-semibold text-brand-600">
				{t("processingBannerLink")} &rarr;
			</span>
		</Link>
	);
}
