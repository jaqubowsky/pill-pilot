import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";

export function FailedBadge() {
	const t = useTranslations();

	return (
		<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-danger-bg text-danger">
			{t("settings.statusFailed")}
		</Badge>
	);
}
