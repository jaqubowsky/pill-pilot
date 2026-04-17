"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";

type SupplementRowProps = {
	supplement: IdentifiedSupplement;
	timeBlocks: TimeBlockSummary[];
	onEdit: () => void;
	onDelete: () => void;
};

export function SupplementRow({ supplement, timeBlocks, onEdit, onDelete }: SupplementRowProps) {
	const t = useTranslations();
	const schedule = supplement.schedules[0];
	const timeBlock = schedule ? timeBlocks.find((tb) => tb.id === schedule.timeBlockId) : null;

	const summary = schedule
		? [
				`${schedule.dosageAmount} ${t(`schedule.units.${schedule.dosageUnit}` as Parameters<typeof t>[0])}`,
				timeBlock?.name,
				supplement.schedules.length > 1 ? `+${supplement.schedules.length - 1}` : null,
			]
				.filter(Boolean)
				.join(" · ")
		: null;

	return (
		<div className="flex items-center justify-between gap-sm py-sm">
			<div className="flex flex-col gap-0.5 min-w-0">
				<span className="text-sm font-medium text-content truncate">
					{supplement.name}
					{supplement.brandName ? ` (${supplement.brandName})` : ""}
				</span>
				{summary && <span className="text-xs text-content-faint">{summary}</span>}
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
