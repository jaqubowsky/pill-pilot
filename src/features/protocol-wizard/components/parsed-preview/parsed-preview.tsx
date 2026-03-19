"use client";

import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { BackButton } from "@/features/protocol-wizard/components/back-button";
import type { ParsedProtocol } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { PriceListItem, ShopWithDelivery } from "@/shared/api/queries/get-price-list";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { ApproveButton } from "./approve-button";
import { DiscardConfirmDialog } from "./discard-confirm-dialog";
import { PreviewBlock } from "./preview-block";
import { PreviewMode, useParsedPreview } from "./use-parsed-preview";
import { VerificationBanner } from "./verification-banner";

export type PriceSheetComponentProps = {
	open: boolean;
	supplementIds: string[];
	items: PriceListItem[];
	shopOptions: ShopWithDelivery[];
	onClose: () => void;
};

type ParsedPreviewProps = {
	protocolId: string;
	initialParsed: ParsedProtocol;
	timeBlocks: TimeBlockSummary[];
	existingSupplements?: ExistingSupplementSummary[];
	mode?: PreviewMode;
	initialStartDate?: string;
	priceListItems?: PriceListItem[];
	priceListShopOptions?: ShopWithDelivery[];
	PriceSheetComponent?: ComponentType<PriceSheetComponentProps>;
};

const MODIFIERS = [restrictToVerticalAxis];

export function ParsedPreview({
	protocolId,
	initialParsed,
	timeBlocks,
	existingSupplements = [],
	mode = PreviewMode.create,
	initialStartDate,
	priceListItems = [],
	priceListShopOptions = [],
	PriceSheetComponent,
}: ParsedPreviewProps) {
	const t = useTranslations();
	const {
		protocolName,
		startDate,
		setStartDate,
		unverifiedCount,
		firstUnverifiedId,
		isApproving,
		blockMap,
		orderedBlocks,
		updateSupplement,
		addSupplement,
		deleteSupplement,
		restoreSupplement,
		verifySupplement,
		handleApprove,
		discardOpen,
		setDiscardOpen,
		isDiscarding,
		handleDiscard,
		handleDragEnd,
		moveToBlock,
		priceSheetOpen,
		newSupplementIds,
		handlePriceSheetClose,
	} = useParsedPreview({
		protocolId,
		initialParsed,
		timeBlocks,
		mode,
		initialStartDate,
	});

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const isCreateMode = mode === PreviewMode.create;

	return (
		<>
			<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
				<div className="flex flex-col gap-sm">
					<BackButton />
					<h1 className="font-display text-2xl text-content">{t("protocolWizard.reviewTitle")}</h1>
					<p className="text-base text-content-muted">{protocolName}</p>
				</div>

				<LabeledInput
					label={t("protocolWizard.startDate")}
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
				/>

				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					modifiers={MODIFIERS}
					onDragEnd={handleDragEnd}
				>
					<div className="flex flex-col gap-md">
						{orderedBlocks.map((tb) => (
							<PreviewBlock
								key={tb.id}
								timeBlock={tb}
								supplements={blockMap.get(tb.id) ?? []}
								allTimeBlocks={timeBlocks}
								existingSupplements={existingSupplements}
								onUpdateSupplement={updateSupplement}
								onAddSupplement={addSupplement}
								onDeleteSupplement={deleteSupplement}
								onRestoreSupplement={restoreSupplement}
								onVerifySupplement={verifySupplement}
								onMoveToBlock={moveToBlock}
							/>
						))}
					</div>
				</DndContext>

				<div className="flex flex-col gap-md">
					{isCreateMode && (
						<VerificationBanner
							unverifiedCount={unverifiedCount}
							firstUnverifiedId={firstUnverifiedId}
						/>
					)}

					<ApproveButton
						mode={mode}
						isApproving={isApproving}
						disabled={isCreateMode && unverifiedCount > 0}
						onClick={handleApprove}
					/>

					{isCreateMode && (
						<Button variant="outline" onClick={() => setDiscardOpen(true)} className="w-full">
							{t("protocolWizard.discardDraft")}
						</Button>
					)}
				</div>
			</div>

			<DiscardConfirmDialog
				open={discardOpen}
				onOpenChange={setDiscardOpen}
				onConfirm={handleDiscard}
				isDiscarding={isDiscarding}
			/>

			{isCreateMode && PriceSheetComponent && (
				<PriceSheetComponent
					open={priceSheetOpen}
					supplementIds={newSupplementIds}
					items={priceListItems}
					shopOptions={priceListShopOptions}
					onClose={handlePriceSheetClose}
				/>
			)}
		</>
	);
}
