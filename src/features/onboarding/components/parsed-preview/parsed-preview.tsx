"use client";

import {
	closestCorners,
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
import type { ParsedProtocol } from "@/features/onboarding/schemas/parsed-protocol-schema";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/onboarding/types";
import { BackButton } from "@/shared/components/back-button";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { PreviewBlock } from "./preview-block";
import { PreviewMode, useParsedPreview } from "./use-parsed-preview";

type ParsedPreviewProps = {
	protocolId: string;
	initialParsed: ParsedProtocol;
	timeBlocks: TimeBlockSummary[];
	existingSupplements: ExistingSupplementSummary[];
	showStepIndicator?: boolean;
	mode?: PreviewMode;
	initialStartDate?: string;
};

const MODIFIERS = [restrictToVerticalAxis];

export function ParsedPreview({
	protocolId,
	initialParsed,
	timeBlocks,
	existingSupplements,
	showStepIndicator = true,
	mode = PreviewMode.create,
	initialStartDate,
}: ParsedPreviewProps) {
	const t = useTranslations();
	const {
		protocolName,
		supplements: allSupplements,
		startDate,
		setStartDate,
		unverifiedCount,
		isApproving,
		blockMap,
		orderedBlocks,
		handleUpdateSupplement,
		handleAddSupplement,
		handleDeleteSupplement,
		handleApprove,
		handleDragOver,
		handleDragEnd,
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
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				{mode === PreviewMode.edit && <BackButton />}
				<h1 className="font-display text-2xl text-content">{t("onboarding.reviewTitle")}</h1>
				<p className="text-base text-content-muted">{protocolName}</p>
			</div>

			<LabeledInput
				label={t("onboarding.startDate")}
				type="date"
				value={startDate}
				onChange={(e) => setStartDate(e.target.value)}
			/>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCorners}
				modifiers={MODIFIERS}
				onDragOver={handleDragOver}
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
								allSupplements={allSupplements}
								allTimeBlocks={timeBlocks}
								existingSupplements={existingSupplements}
								onUpdateSupplement={handleUpdateSupplement}
								onAddSupplement={handleAddSupplement}
								onDeleteSupplement={handleDeleteSupplement}
							/>
						);
					})}
				</div>
			</DndContext>

			<div className="flex flex-col gap-md">
				{mode === PreviewMode.create && unverifiedCount > 0 && (
					<div className="rounded-xl bg-warning-bg border border-warning/20 p-md">
						<p className="text-sm text-[#8B6914]">
							{unverifiedCount === 1
								? t("onboarding.requiresVerification", { count: unverifiedCount })
								: t("onboarding.requiresVerificationMany", { count: unverifiedCount })}
						</p>
					</div>
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
							: t("onboarding.approveProtocol")}
				</Button>
			</div>

			{showStepIndicator && (
				<div className="flex flex-col items-center gap-xs mt-auto">
					<span className="text-sm text-content-muted">
						{t("onboarding.stepOf", { current: 2, total: 2 })}
					</span>
					<div className="flex gap-xs">
						<span className="size-2 rounded-full bg-brand-200" />
						<span className="size-2 rounded-full bg-brand-500" />
					</div>
				</div>
			)}
		</div>
	);
}
