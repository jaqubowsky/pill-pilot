import { AlertTriangle, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { CONFIDENCE_THRESHOLD } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

interface ConfidenceBadgeProps {
	confidence: number;
	uncertaintyReason?: string | null;
	onVerify: () => void;
}

export function ConfidenceBadge({ confidence, uncertaintyReason, onVerify }: ConfidenceBadgeProps) {
	const t = useTranslations("protocolWizard");

	if (confidence >= CONFIDENCE_THRESHOLD) return null;

	return (
		<Popover>
			<PopoverTrigger className="flex items-center gap-xs text-left min-h-11">
				<AlertTriangle className="size-3 shrink-0 text-[#8B6914]" />
				<span className="text-xs text-[#8B6914] truncate">
					{uncertaintyReason ?? t("badgeCheck")}
				</span>
			</PopoverTrigger>
			<PopoverContent side="top" className="w-64 p-sm flex flex-col gap-sm">
				{uncertaintyReason && <p className="text-xs text-content-muted">{uncertaintyReason}</p>}
				<Button variant="ghost" size="sm" className="text-brand-600 w-full" onClick={onVerify}>
					<Check className="size-4 stroke-[1.5]" />
					{t("badgeVerify")}
				</Button>
			</PopoverContent>
		</Popover>
	);
}
