"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { ExportProtocolButton } from "../export-protocol-button";
import { CardActionSection } from "./card-action-section";
import { DeleteButton } from "./delete-button";

type DraftActionsProps = {
	protocolId: string;
	onContinueDraft: () => void;
	onRequestDelete: () => void;
};

export function DraftActions({ protocolId, onContinueDraft, onRequestDelete }: DraftActionsProps) {
	const t = useTranslations();

	return (
		<CardActionSection>
			<ExportProtocolButton protocolId={protocolId} />
			<Button className="w-full" onClick={onContinueDraft}>
				{t("settings.continueDraft")}
			</Button>
			<DeleteButton onClick={onRequestDelete} />
		</CardActionSection>
	);
}
