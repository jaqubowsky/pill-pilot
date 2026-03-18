"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { CardActionSection } from "./card-action-section";
import { DeleteButton } from "./delete-button";

type DraftActionsProps = {
	onContinueDraft: () => void;
	onRequestDelete: () => void;
};

export function DraftActions({ onContinueDraft, onRequestDelete }: DraftActionsProps) {
	const t = useTranslations();

	return (
		<CardActionSection>
			<Button className="w-full" onClick={onContinueDraft}>
				{t("settings.continueDraft")}
			</Button>
			<DeleteButton onClick={onRequestDelete} />
		</CardActionSection>
	);
}
