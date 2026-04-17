"use client";

import { useTranslations } from "next-intl";
import { ShareButton } from "@/features/protocol-wizard/components/share-button";
import { Button } from "@/shared/components/ui/button";
import { CardActionSection } from "./card-action-section";

type ActiveActionsProps = {
	protocolId: string;
	shareToken: string | null;
	onRequestArchive: () => void;
};

export function ActiveActions({ protocolId, shareToken, onRequestArchive }: ActiveActionsProps) {
	const t = useTranslations();

	return (
		<CardActionSection>
			<ShareButton protocolId={protocolId} initialShareToken={shareToken} />
			<Button variant="destructive" className="w-full" onClick={onRequestArchive}>
				{t("common.archive")}
			</Button>
		</CardActionSection>
	);
}
