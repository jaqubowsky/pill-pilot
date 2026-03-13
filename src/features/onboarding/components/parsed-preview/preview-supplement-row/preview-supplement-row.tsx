"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Link, Pencil, Repeat, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary } from "@/features/onboarding/types";
import { CriticalBadge } from "@/shared/components/critical-badge";
import { Button } from "@/shared/components/ui/button";
import { formatQuantity } from "@/shared/lib/format";
import type { EditedSupplement } from "../parsed-preview.schema";
import { ConfidenceBadge } from "./confidence-badge";
import { SupplementLinkBadge } from "./supplement-link-badge";

const CONFIDENCE_THRESHOLD = 0.7;

type PreviewSupplementRowProps = {
	id: string;
	supplement: EditedSupplement;
	scheduleIndex: number;
	existingSupplements: ExistingSupplementSummary[];
	timeBlockId: string;
	prerequisiteName: string | null;
	onEdit: () => void;
	onDelete: () => void;
};

export function PreviewSupplementRow({
	id,
	supplement,
	scheduleIndex,
	existingSupplements,
	timeBlockId,
	prerequisiteName,
	onEdit,
	onDelete,
}: PreviewSupplementRowProps) {
	const t = useTranslations();

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		data: { timeBlockId },
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
		zIndex: isDragging ? 10 : undefined,
	} satisfies React.CSSProperties;

	const schedule = supplement.schedules[scheduleIndex];
	if (!schedule) return null;

	const isLowConfidence = supplement.confidence < CONFIDENCE_THRESHOLD;

	return (
		<div ref={setNodeRef} style={style} className="flex items-start justify-between gap-sm py-xs">
			<button
				type="button"
				className="mt-sm cursor-grab touch-none text-content-faint"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="size-4 stroke-[1.5]" />
			</button>
			<div className="flex flex-col gap-xs flex-1 min-w-0">
				<div className="flex items-center gap-sm flex-wrap">
					<span className="text-sm font-medium text-content truncate">{supplement.name}</span>
					<span className="text-sm text-content-muted whitespace-nowrap">
						{formatQuantity(schedule.dosageAmount)} {t(`schedule.units.${schedule.dosageUnit}`)}
					</span>
				</div>
				<div className="flex items-center gap-xs flex-wrap">
					<SupplementLinkBadge existingSupplementId={supplement.existingSupplementId} />
					{supplement.isCritical && <CriticalBadge />}
					{supplement.cycleDaysOn && supplement.cycleDaysOff ? (
						<span className="inline-flex items-center gap-[2px] rounded-lg px-sm py-xs text-xs font-semibold text-content-faint">
							<Repeat className="size-3 stroke-[1.5]" />
							{t("schedule.cyclingLabel", {
								on: supplement.cycleDaysOn,
								off: supplement.cycleDaysOff,
							})}
						</span>
					) : null}
					{isLowConfidence && <ConfidenceBadge confidence={supplement.confidence} />}
				</div>
				{supplement.notes && <p className="text-xs text-content-faint">{supplement.notes}</p>}
				{prerequisiteName && supplement.delayDays && (
					<span className="inline-flex items-center gap-xs text-xs text-content-faint">
						<Link className="size-3 stroke-[1.5]" />
						{t("schedule.dependencyBadge", {
							count: supplement.delayDays,
							name: prerequisiteName,
						})}
					</span>
				)}
			</div>
			<div className="flex items-center">
				<Button
					variant="ghost"
					size="icon-lg"
					onClick={onEdit}
					className="min-h-11 min-w-11 active:scale-[0.98] transition-transform"
				>
					<Pencil className="size-4 text-content-faint stroke-[1.5]" />
				</Button>
				<Button
					variant="ghost"
					size="icon-lg"
					onClick={onDelete}
					className="min-h-11 min-w-11 active:scale-[0.98] transition-transform"
				>
					<Trash2 className="size-4 text-danger stroke-[1.5]" />
				</Button>
			</div>
		</div>
	);
}
