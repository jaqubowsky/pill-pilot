"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { CardActionSection } from "./card-action-section";
import { DeleteButton } from "./delete-button";

type FailedActionsProps = {
	onRetry: () => void;
	onRequestDelete: () => void;
};

export function FailedActions({ onRetry, onRequestDelete }: FailedActionsProps) {
	const t = useTranslations();

	return (
		<CardActionSection>
			<p className="text-sm text-danger">{t("settings.failedDescription")}</p>
			<Button className="w-full" onClick={onRetry}>
				<RefreshCw className="size-4" />
				{t("settings.retry")}
			</Button>
			<DeleteButton onClick={onRequestDelete} />
		</CardActionSection>
	);
}
