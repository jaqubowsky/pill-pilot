"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import type { PreviewMode } from "./use-parsed-preview";
import { PreviewMode as PreviewModeEnum } from "./use-parsed-preview";

type ApproveButtonProps = {
	mode: PreviewMode;
	isApproving: boolean;
	disabled: boolean;
	onClick: () => void;
};

export function ApproveButton({ mode, isApproving, disabled, onClick }: ApproveButtonProps) {
	const t = useTranslations();

	function getLabel() {
		if (isApproving) return t("common.loading");
		if (mode === PreviewModeEnum.edit) return t("common.saveChanges");
		return t("protocolWizard.approveProtocol");
	}

	return (
		<Button onClick={onClick} disabled={disabled || isApproving} className="w-full">
			{getLabel()}
		</Button>
	);
}
