"use client";

import { Pencil, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

type ArchivedBadgeProps = {
	onEdit: () => void;
	onReactivate: () => void;
	isReactivating: boolean;
};

export function ArchivedBadge({ onEdit, onReactivate, isReactivating }: ArchivedBadgeProps) {
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
			<Button
				variant="ghost"
				size="icon-sm"
				className="bg-brand-100 text-brand-700 hover:bg-brand-200"
				onClick={onReactivate}
				disabled={isReactivating}
				aria-label={t("common.reactivate")}
			>
				<RotateCcw className="size-4 stroke-[2.5]" />
			</Button>
			<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-surface-sunken text-content-muted">
				{t("settings.statusArchived")}
			</Badge>
		</>
	);
}
