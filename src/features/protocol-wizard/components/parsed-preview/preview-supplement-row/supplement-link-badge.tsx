"use client";

import { Link2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconBadge } from "@/shared/components/icon-badge";

interface SupplementLinkBadgeProps {
	existingSupplementId: string | null;
}

export function SupplementLinkBadge({ existingSupplementId }: SupplementLinkBadgeProps) {
	const t = useTranslations("protocolWizard");

	if (existingSupplementId) {
		return <IconBadge icon={Link2} variant="success" label={t("badgeLinked")} />;
	}

	return <IconBadge icon={Plus} variant="info" label={t("badgeNew")} />;
}
