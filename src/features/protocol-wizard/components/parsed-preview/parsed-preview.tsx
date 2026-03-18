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
import type { ParsedProtocol } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { PriceListItem, ShopOption } from "@/features/shopping/api/queries/get-price-list";
import { PriceSheet } from "@/features/shopping/components/price-sheet";
import { BackButton } from "@/features/protocol-wizard/components/back-button";
import { LabeledInput } from "@/shared/components/labeled-input";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { PreviewBlock } from "./preview-block";
import { PreviewMode, useParsedPreview } from "./use-parsed-preview";

type ParsedPreviewProps = {
	protocolId: string;
	initialParsed: ParsedProtocol;
	timeBlocks: TimeBlockSummary[];
	existingSupplements?: ExistingSupplementSummary[];
	mode?: PreviewMode;
	initialStartDate?: string;
	priceListItems?: PriceListItem[];
	priceListShopOptions?: ShopOption[];
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
		handleUpdateSupplement,
		handleAddSupplement,
		handleDeleteSupplement,
		handleRestoreSupplement,
		handleVerifySupplement,
		handleApprove,
		discardOpen,
		setDiscardOpen,
		isDiscarding,
		handleDiscard,
		handleDragEnd,
		handleMoveToBlock,
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
						{orderedBlocks.map((tb) => {
							const blockSupplements = blockMap.get(tb.id) ?? [];
							return (
								<PreviewBlock
									key={tb.id}
									timeBlock={tb}
									supplements={blockSupplements}
									allTimeBlocks={timeBlocks}
									existingSupplements={existingSupplements}
									onUpdateSupplement={handleUpdateSupplement}
									onAddSupplement={handleAddSupplement}
									onDeleteSupplement={handleDeleteSupplement}
									onRestoreSupplement={handleRestoreSupplement}
									onVerifySupplement={handleVerifySupplement}
									onMoveToBlock={handleMoveToBlock}
								/>
							);
						})}
					</div>
				</DndContext>

				<div className="flex flex-col gap-md">
					{mode === PreviewMode.create && unverifiedCount > 0 && (
						<button
							type="button"
							onClick={() => {
								if (!firstUnverifiedId) return;
								document
									.querySelector(`[data-supplement-id="${firstUnverifiedId}"]`)
									?.scrollIntoView({ behavior: "smooth", block: "center" });
							}}
							className="w-full rounded-xl bg-warning-bg border border-warning/20 p-md text-left active:scale-[0.99] transition-transform"
						>
							<p className="text-sm text-[#8B6914]">
								{unverifiedCount === 1
									? t("protocolWizard.requiresVerification", { count: unverifiedCount })
									: t("protocolWizard.requiresVerificationMany", { count: unverifiedCount })}
								<span className="ml-xs">&darr;</span>
							</p>
						</button>
					)}

					<Button
						onClick={handleApprove}
						disabled={(mode === PreviewMode.create && unverifiedCount > 0) || isApproving}
						className="w-full"
					>
						{isApproving
							? t("common.loading")
							: mode === PreviewMode.edit
								? t("common.saveChanges")
								: t("protocolWizard.approveProtocol")}
					</Button>

					{mode === PreviewMode.create && (
						<Button variant="outline" onClick={() => setDiscardOpen(true)} className="w-full">
							{t("protocolWizard.discardDraft")}
						</Button>
					)}
				</div>
			</div>

			<AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("protocolWizard.discardConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("protocolWizard.discardConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDiscard} disabled={isDiscarding}>
							{t("protocolWizard.discardDraft")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{mode === PreviewMode.create && (
				<PriceSheet
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
