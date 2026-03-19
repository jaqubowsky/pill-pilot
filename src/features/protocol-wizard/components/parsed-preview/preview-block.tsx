"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Package, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import { useSheetState } from "../../hooks/use-sheet-state";
import { findPackageSize, findScheduleIndex } from "../../lib/supplement-defaults";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";
import { ConnectedSupplementSheet } from "../protocol-base/connected-supplement-sheet";
import { ExistingSupplementPicker } from "../protocol-base/existing-supplement-picker";
import type { EditedSupplement } from "../protocol-base/parsed-preview.schema";
import { PreviewSupplementRow } from "./preview-supplement-row";

type PreviewBlockProps = {
	timeBlock: TimeBlockSummary;
	supplements: IdentifiedSupplement[];
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

	const {
		sheetState,
		pickerOpen,
		setPickerOpen,
		openAddSheet,
		openPicker,
		openAddFromExisting,
		openEditSheet,
		closeSheet,
	} = useSheetState(timeBlock.id);

	function handleSheetSave(edited: EditedSupplement) {
		if (sheetState === null) return;

		if (sheetState.supplement === null) {
			onAddSupplement(edited);
		} else {
			onUpdateSupplement(sheetState.supplement._id, edited);
		}
	}

	const sortableIds = supplements.map((s) => `${timeBlock.id}:${s._id}`);
	const hasExisting = existingSupplements.length > 0;

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
						const scheduleIndex = findScheduleIndex(supplement.schedules, timeBlock.id);
						if (scheduleIndex === -1) return null;

						return (
							<PreviewSupplementRow
								key={`${timeBlock.id}:${supplement._id}`}
								id={`${timeBlock.id}:${supplement._id}`}
								supplement={supplement}
								scheduleIndex={scheduleIndex}
								timeBlockId={timeBlock.id}
								allTimeBlocks={allTimeBlocks}
								packageSize={findPackageSize(supplement.existingSupplementId, existingSupplements)}
								onEdit={() => openEditSheet(supplement, scheduleIndex)}
								onDelete={() => onDeleteSupplement(supplement._id)}
								onRestore={() => onRestoreSupplement(supplement._id)}
								onVerify={() => onVerifySupplement(supplement._id)}
								onMoveToBlock={(si, newBlockId) => onMoveToBlock(supplement._id, si, newBlockId)}
							/>
						);
					})}
				</div>
			</SortableContext>

			<div className="flex items-center gap-sm">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => openAddSheet()}
					className="text-brand-600 min-h-11 flex-1"
				>
					<Plus className="size-4 stroke-[1.5]" />
					{t("protocolWizard.addSupplement")}
				</Button>
				{hasExisting && (
					<>
						<div className="w-px h-5 bg-edge-subtle" />
						<Button
							variant="ghost"
							size="sm"
							onClick={openPicker}
							className="text-brand-600 min-h-11 flex-1"
						>
							<Package className="size-4 stroke-[1.5]" />
							{t("protocolWizard.manual.addFromExisting")}
						</Button>
					</>
				)}
			</div>

			<ConnectedSupplementSheet
				sheetState={sheetState}
				existingSupplements={existingSupplements}
				timeBlocks={allTimeBlocks}
				onClose={closeSheet}
				onSave={handleSheetSave}
			/>

			{hasExisting && (
				<ExistingSupplementPicker
					supplements={existingSupplements}
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					onPick={(existing) => openAddFromExisting(existing)}
				/>
			)}
		</div>
	);
}
