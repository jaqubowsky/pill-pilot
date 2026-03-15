"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import type { EditedSupplement } from "./parsed-preview.schema";
import { PreviewSupplementRow } from "./preview-supplement-row";
import { PreviewSupplementSheet } from "./preview-supplement-sheet";
import type { IdentifiedSupplement } from "./use-parsed-preview";

type SheetState = {
	supplement: IdentifiedSupplement | null;
	scheduleIndex: number;
	defaultTimeBlockId?: string;
} | null;

type PreviewBlockProps = {
	timeBlock: TimeBlockSummary;
	supplements: IdentifiedSupplement[];
	allSupplements: IdentifiedSupplement[];
	allTimeBlocks: TimeBlockSummary[];
	existingSupplements: ExistingSupplementSummary[];
	onUpdateSupplement: (id: string, updated: EditedSupplement) => void;
	onAddSupplement: (supplement: EditedSupplement) => void;
	onDeleteSupplement: (id: string) => void;
	onRestoreSupplement: (id: string) => void;
	onVerifySupplement: (id: string) => void;
	onMoveToBlock: (supplementId: string, scheduleIndex: number, newBlockId: string) => void;
};

export function PreviewBlock({
	timeBlock,
	supplements,
	allSupplements,
	allTimeBlocks,
	existingSupplements,
	onUpdateSupplement,
	onAddSupplement,
	onDeleteSupplement,
	onRestoreSupplement,
	onVerifySupplement,
	onMoveToBlock,
}: PreviewBlockProps) {
	const t = useTranslations();
	const [sheetState, setSheetState] = useState<SheetState>(null);

	function handleSheetSave(edited: EditedSupplement) {
		if (sheetState === null) return;

		if (sheetState.supplement === null) {
			onAddSupplement(edited);
		} else {
			onUpdateSupplement(sheetState.supplement._id, edited);
		}
	}

	const sortableIds = supplements.map((s) => `${timeBlock.id}:${s._id}`);

	return (
		<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-md">
			<div className="flex items-center justify-between">
				<h2 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
					{timeBlock.name}
				</h2>
				<span className="text-xs text-content-faint">({supplements.length})</span>
			</div>

			<SortableContext id={timeBlock.id} items={sortableIds} strategy={verticalListSortingStrategy}>
				<div className="flex flex-col divide-y divide-edge-subtle min-h-[2rem]">
					{supplements.map((supplement) => {
						const scheduleIndex = supplement.schedules.findIndex(
							(s) => s.timeBlockId === timeBlock.id,
						);
						if (scheduleIndex === -1) return null;

						return (
							<PreviewSupplementRow
								key={`${timeBlock.id}:${supplement._id}`}
								id={`${timeBlock.id}:${supplement._id}`}
								supplement={supplement}
								scheduleIndex={scheduleIndex}
								existingSupplements={existingSupplements}
								timeBlockId={timeBlock.id}
								allTimeBlocks={allTimeBlocks}
								onEdit={() => setSheetState({ supplement, scheduleIndex })}
								onDelete={() => onDeleteSupplement(supplement._id)}
								onRestore={() => onRestoreSupplement(supplement._id)}
								onVerify={() => onVerifySupplement(supplement._id)}
								onMoveToBlock={(si, newBlockId) => onMoveToBlock(supplement._id, si, newBlockId)}
							/>
						);
					})}
				</div>
			</SortableContext>

			<Button
				variant="ghost"
				size="sm"
				onClick={() =>
					setSheetState({
						supplement: null,
						scheduleIndex: 0,
						defaultTimeBlockId: timeBlock.id,
					})
				}
				className="text-brand-600 py-xs"
			>
				<Plus className="size-4 stroke-[1.5]" />
				{t("protocolWizard.addSupplement")}
			</Button>

			<PreviewSupplementSheet
				supplement={sheetState?.supplement ?? null}
				scheduleIndex={sheetState?.scheduleIndex ?? 0}
				defaultTimeBlockId={sheetState?.defaultTimeBlockId}
				timeBlocks={allTimeBlocks}
				open={sheetState !== null}
				onOpenChange={(open) => {
					if (!open) setSheetState(null);
				}}
				onSave={handleSheetSave}
			/>
		</div>
	);
}
