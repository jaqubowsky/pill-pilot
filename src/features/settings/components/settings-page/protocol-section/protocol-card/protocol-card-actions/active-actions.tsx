"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { CardActionSection } from "./card-action-section";

type ActiveActionsProps = {
	onRequestArchive: () => void;
};

export function ActiveActions({ onRequestArchive }: ActiveActionsProps) {
	const t = useTranslations();

	return (
		<CardActionSection>
			<Button variant="destructive" className="w-full" onClick={onRequestArchive}>
				{t("common.archive")}
			</Button>
		</CardActionSection>
	);
}
