"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import type { IdentifiedSupplement } from "../parsed-preview/use-parsed-preview";

type SupplementRowProps = {
	supplement: IdentifiedSupplement;
	timeBlocks: TimeBlockSummary[];
	onEdit: () => void;
	onDelete: () => void;
};

export function SupplementRow({ supplement, timeBlocks, onEdit, onDelete }: SupplementRowProps) {
	const t = useTranslations();
	const schedule = supplement.schedules[0];
	const timeBlock = timeBlocks.find((tb) => tb.id === schedule?.timeBlockId);

	return (
		<div className="flex items-center justify-between gap-sm py-sm">
			<div className="flex flex-col gap-0.5 min-w-0">
				<span className="text-sm font-medium text-content truncate">
					{supplement.name}
					{supplement.brandName ? ` (${supplement.brandName})` : ""}
				</span>
				{schedule && (
					<span className="text-xs text-content-faint">
						{schedule.dosageAmount} {t(`schedule.units.${schedule.dosageUnit}`)}
						{timeBlock ? ` · ${timeBlock.name}` : ""}
						{supplement.schedules.length > 1 && ` +${supplement.schedules.length - 1}`}
					</span>
				)}
			</div>
			<div className="flex items-center gap-xs shrink-0">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onEdit}
					className="text-content-faint"
				>
					<Pencil className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onDelete}
					className="text-content-faint"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}
