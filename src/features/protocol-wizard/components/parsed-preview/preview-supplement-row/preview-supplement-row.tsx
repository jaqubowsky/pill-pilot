"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpDown, GripVertical, Pencil, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { CONFIDENCE_THRESHOLD } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { IconBadge } from "@/shared/components/icon-badge";
import { SupplementInfo } from "@/shared/components/supplement-info";
import { Button } from "@/shared/components/ui/button";
import type { IdentifiedSupplement } from "../use-parsed-preview";
import { ConfidenceBadge } from "./confidence-badge";
import { SupplementBadges } from "./supplement-badges";
import { SupplementLinkBadge } from "./supplement-link-badge";

type PreviewSupplementRowProps = {
	id: string;
	supplement: IdentifiedSupplement;
	scheduleIndex: number;
	timeBlockId: string;
	allTimeBlocks: TimeBlockSummary[];
	packageSize?: number | null;
	onEdit: () => void;
	onDelete: () => void;
	onRestore: () => void;
	onVerify: () => void;
	onMoveToBlock: (scheduleIndex: number, newBlockId: string) => void;
};

export function PreviewSupplementRow({
	id,
	supplement,
	scheduleIndex,
	timeBlockId,
	allTimeBlocks,
	packageSize,
	onEdit,
	onDelete,
	onRestore,
	onVerify,
	onMoveToBlock,
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

	if (supplement._removed) {
		return (
			<div
				ref={setNodeRef}
				style={style}
				className="flex items-center justify-between py-xs opacity-40"
			>
				<span className="text-sm text-content-muted line-through truncate flex-1 min-w-0">
					{supplement.name}
				</span>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onRestore}
					className="active:scale-[0.98] transition-transform"
				>
					<RotateCcw className="size-4 text-brand-600 stroke-[1.5]" />
				</Button>
			</div>
		);
	}

	const isLowConfidence = supplement.confidence < CONFIDENCE_THRESHOLD;

	return (
		<div
			ref={setNodeRef}
			style={style}
			data-supplement-id={supplement._id}
			className="flex items-center justify-between gap-sm py-xs"
		>
			<button
				type="button"
				className="p-1.5 cursor-grab touch-none text-content-faint"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="size-4 stroke-[1.5]" />
			</button>
			<SupplementInfo
				name={supplement.name}
				subtitle={supplement.brandName || null}
				dosageAmount={schedule.dosageAmount}
				dosageUnit={schedule.dosageUnit}
				notes={schedule.notes ?? supplement.notes}
				notesPopoverSide="top"
				warning={
					isLowConfidence ? (
						<ConfidenceBadge
							confidence={supplement.confidence}
							uncertaintyReason={supplement.uncertaintyReason}
							onVerify={onVerify}
						/>
					) : null
				}
				badges={
					<>
						<SupplementLinkBadge existingSupplementId={supplement.existingSupplementId} />
						{(schedule.isCritical ?? supplement.isCritical) && (
							<IconBadge icon={ShieldAlert} variant="danger" label={t("dashboard.critical")} />
						)}
						<SupplementBadges
							supplement={supplement}
							schedule={schedule}
							finishPackage={schedule.finishPackage}
							packageSize={packageSize}
							totalDailyDosage={supplement.schedules.reduce((sum, s) => sum + s.dosageAmount, 0)}
						/>
					</>
				}
			/>
			<div className="flex items-center">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onEdit}
					className="active:scale-[0.98] transition-transform"
				>
					<Pencil className="size-4 text-content-faint stroke-[1.5]" />
				</Button>
				<div className="relative min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-surface-sunken active:scale-[0.98] transition-all">
					<ArrowUpDown className="size-4 text-content-faint stroke-[1.5]" />
					<select
						value={timeBlockId}
						onChange={(e) => onMoveToBlock(scheduleIndex, e.target.value)}
						className="absolute inset-0 opacity-0"
					>
						{allTimeBlocks.map((tb) => (
							<option key={tb.id} value={tb.id}>
								{tb.name}
							</option>
						))}
					</select>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onDelete}
					className="active:scale-[0.98] transition-transform"
				>
					<Trash2 className="size-4 text-danger stroke-[1.5]" />
				</Button>
			</div>
		</div>
	);
}
