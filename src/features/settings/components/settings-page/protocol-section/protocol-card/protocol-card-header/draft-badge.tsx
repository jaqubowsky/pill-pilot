import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";

export function DraftBadge() {
	const t = useTranslations();

	return (
		<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-warning-bg text-[#8B6914]">
			{t("settings.statusDraft")}
		</Badge>
	);
}
