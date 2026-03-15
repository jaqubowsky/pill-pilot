"use client";

import { useTranslations } from "next-intl";

export function StockWarningBadge() {
	const t = useTranslations("dashboard");

	return (
		<span className="inline-flex items-center rounded-lg bg-warning-bg px-sm py-xs text-xs font-semibold uppercase tracking-wide text-[#8B6914]">
			{t("lowStock")}
		</span>
	);
}
