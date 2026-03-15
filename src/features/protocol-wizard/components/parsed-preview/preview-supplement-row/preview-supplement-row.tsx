"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ArrowUpDown,
	GripVertical,
	Lock,
	MessageSquareText,
	Pencil,
	Repeat,
	RotateCcw,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { CONFIDENCE_THRESHOLD } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { CriticalBadge } from "@/shared/components/critical-badge";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { formatQuantity } from "@/shared/lib/format";
import type { EditedSupplement } from "../parsed-preview.schema";
import type { IdentifiedSupplement } from "../use-parsed-preview";
import { ConfidenceBadge } from "./confidence-badge";
import { SupplementLinkBadge } from "./supplement-link-badge";

const NOTE_TRUNCATE_LENGTH = 35;

type PreviewSupplementRowProps = {
	id: string;
	supplement: IdentifiedSupplement;
	scheduleIndex: number;
	existingSupplements: ExistingSupplementSummary[];
	timeBlockId: string;
	allTimeBlocks: TimeBlockSummary[];
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
	existingSupplements,
	timeBlockId,
	allTimeBlocks,
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
					size="icon-lg"
					onClick={onRestore}
					className="min-h-11 min-w-11 active:scale-[0.98] transition-transform"
				>
					<RotateCcw className="size-4 text-brand-600 stroke-[1.5]" />
				</Button>
			</div>
		);
	}

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
					{isLowConfidence && (
						<ConfidenceBadge
							confidence={supplement.confidence}
							uncertaintyReason={supplement.uncertaintyReason}
							onVerify={onVerify}
						/>
					)}
				</div>
				{supplement.notes &&
					(supplement.notes.length > NOTE_TRUNCATE_LENGTH ? (
						<Popover>
							<PopoverTrigger className="flex items-center gap-xs text-left">
								<MessageSquareText className="size-3 stroke-[1.5] text-content-faint shrink-0" />
								<p className="text-xs text-content-faint truncate">{supplement.notes}</p>
							</PopoverTrigger>
							<PopoverContent side="top" className="w-64 p-sm">
								<p className="text-xs text-content-muted">{supplement.notes}</p>
							</PopoverContent>
						</Popover>
					) : (
						<p className="text-xs text-content-faint">{supplement.notes}</p>
					))}
				{(supplement.startDayOffset > 0 || supplement.durationDays) && (
					<span className="inline-flex items-center gap-xs rounded-lg bg-surface-sunken px-sm py-xs text-xs text-content-muted">
						<Lock className="size-3 stroke-[1.5]" />
						{supplement.startDayOffset > 0 && supplement.durationDays
							? t("schedule.dayRangeBadge", {
									from: supplement.startDayOffset,
									to: supplement.startDayOffset + supplement.durationDays,
								})
							: supplement.startDayOffset > 0
								? t("schedule.startDayOffsetBadge", {
										count: supplement.startDayOffset,
									})
								: t("schedule.durationBadge", {
										count: supplement.durationDays!,
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
