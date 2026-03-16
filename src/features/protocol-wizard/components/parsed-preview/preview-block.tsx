"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Package, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import { ExistingSupplementPicker } from "../manual-protocol-form/existing-supplement-picker";
import type { EditedSupplement } from "./parsed-preview.schema";
import { PreviewSupplementRow } from "./preview-supplement-row";
import { PreviewSupplementSheet } from "./preview-supplement-sheet";
import type { IdentifiedSupplement } from "./use-parsed-preview";

type SheetState = {
	supplement: IdentifiedSupplement | null;
	scheduleIndex: number;
	defaultTimeBlockId?: string;
	fromExisting?: boolean;
} | null;

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
	const [sheetState, setSheetState] = useState<SheetState>(null);
	const [pickerOpen, setPickerOpen] = useState(false);

	function handleSheetSave(edited: EditedSupplement) {
		if (sheetState === null) return;

		if (sheetState.supplement === null) {
			onAddSupplement(edited);
		} else {
			onUpdateSupplement(sheetState.supplement._id, edited);
		}
	}

	const handlePickExisting = useCallback(
		(existing: ExistingSupplementSummary) => {
			setPickerOpen(false);
			const prefilled: IdentifiedSupplement = {
				name: existing.name,
				existingSupplementId: existing.id,
				brandName: existing.brandName,
				category: SupplementCategory.supplement,
				isCritical: false,
				notes: null,
				cycleDaysOn: null,
				cycleDaysOff: null,
				startDayOffset: 0,
				durationDays: null,
				dosageIntervalMinutes: null,
				waitAfterTakingMinutes: null,
				confidence: 1,
				uncertaintyReason: null,
				schedules: [
					{
						dosageAmount: 1,
						dosageUnit: DosageUnit.capsule,
						timeBlockId: timeBlock.id,
						notes: null,
						isCritical: false,
						waitAfterTakingMinutes: null,
						cycleDaysOn: null,
						cycleDaysOff: null,
						startDayOffset: 0,
						durationDays: null,
					},
				],
				_id: crypto.randomUUID(),
			};
			setSheetState({
				supplement: prefilled,
				scheduleIndex: 0,
				fromExisting: true,
			});
		},
		[timeBlock.id],
	);

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
								timeBlockId={timeBlock.id}
								allTimeBlocks={allTimeBlocks}
								packageSize={
									supplement.existingSupplementId
										? (existingSupplements.find((s) => s.id === supplement.existingSupplementId)
												?.packageSize ?? null)
										: null
								}
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

			<div className="flex items-center gap-sm">
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
							onClick={() => setPickerOpen(true)}
							className="text-brand-600 min-h-11 flex-1"
						>
							<Package className="size-4 stroke-[1.5]" />
							{t("protocolWizard.manual.addFromExisting")}
						</Button>
					</>
				)}
			</div>

			<PreviewSupplementSheet
				supplement={sheetState?.supplement ?? null}
				scheduleIndex={sheetState?.scheduleIndex ?? 0}
				defaultTimeBlockId={sheetState?.defaultTimeBlockId}
				timeBlocks={allTimeBlocks}
				packageSize={
					sheetState?.supplement?.existingSupplementId
						? (existingSupplements.find((s) => s.id === sheetState.supplement?.existingSupplementId)
								?.packageSize ?? null)
						: null
				}
				totalDailyDosage={
					sheetState?.supplement
						? sheetState.supplement.schedules.reduce((sum, s) => sum + s.dosageAmount, 0)
						: undefined
				}
				open={sheetState !== null}
				onOpenChange={(open) => {
					if (!open) setSheetState(null);
				}}
				onSave={handleSheetSave}
				title={
					sheetState?.fromExisting ? t("protocolWizard.configureExistingSupplement") : undefined
				}
			/>

			{hasExisting && (
				<ExistingSupplementPicker
					supplements={existingSupplements}
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					onPick={handlePickExisting}
				/>
			)}
		</div>
	);
}
