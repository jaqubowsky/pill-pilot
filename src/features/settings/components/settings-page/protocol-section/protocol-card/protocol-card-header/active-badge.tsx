"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

type ActiveBadgeProps = {
	onEdit: () => void;
};

export function ActiveBadge({ onEdit }: ActiveBadgeProps) {
	const t = useTranslations();

	return (
		<>
			<Button
				variant="ghost"
				size="icon-sm"
				className="text-content-muted"
				onClick={onEdit}
				aria-label={t("common.edit")}
			>
				<Pencil className="size-4 stroke-2" />
			</Button>
			<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-success-bg text-brand-700">
				{t("settings.statusActive")}
			</Badge>
		</>
	);
}
