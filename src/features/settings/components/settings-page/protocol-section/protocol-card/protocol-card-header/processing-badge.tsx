import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";

export function ProcessingBadge() {
	const t = useTranslations();

	return (
		<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-brand-100 text-brand-700 flex items-center gap-xs">
			<Loader2 className="size-3 animate-spin" />
			{t("settings.statusProcessing")}
		</Badge>
	);
}
