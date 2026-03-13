import { useTranslations } from "next-intl";

export function CriticalBadge() {
	const t = useTranslations("dashboard");

	return (
		<span className="inline-flex items-center rounded-lg bg-danger-bg px-sm py-xs text-xs font-semibold uppercase tracking-wide text-danger">
			{t("critical")}
		</span>
	);
}
