"use client";

import { Package, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { BackButton } from "@/features/protocol-wizard/components/back-button";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { PreviewSupplementSheet } from "../parsed-preview/preview-supplement-sheet";
import { ExistingSupplementPicker } from "./existing-supplement-picker";
import { SupplementRow } from "./supplement-row";
import { useManualProtocolForm } from "./use-manual-protocol-form";

type ManualProtocolFormProps = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function ManualProtocolForm({ supplements, timeBlocks }: ManualProtocolFormProps) {
	const t = useTranslations();

	const {
		protocolName,
		setProtocolName,
		protocolNameError,
		supplements: addedSupplements,
		sheetState,
		pickerOpen,
		setPickerOpen,
		isPending,
		openPicker,
		openAddSheet,
		openAddFromExisting,
		openEditSheet,
		closeSheet,
		handleSheetSave,
		deleteSupplement,
		handleSubmit,
	} = useManualProtocolForm({
		timeBlocks,
		t: (key: string) => t(key as Parameters<typeof t>[0]),
	});

	const hasExisting = supplements.length > 0;

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<BackButton />
				<h1 className="font-display text-2xl text-content">{t("protocolWizard.manual.title")}</h1>
				<p className="text-base text-content-muted">{t("protocolWizard.manual.description")}</p>
			</div>

			<LabeledInput
				label={t("protocolWizard.manual.protocolName")}
				value={protocolName}
				onChange={(e) => setProtocolName(e.target.value)}
				placeholder={t("protocolWizard.manual.protocolNamePlaceholder")}
				error={protocolNameError ?? undefined}
			/>

			<div className="flex flex-col gap-md">
				<h2 className="text-lg font-semibold text-content">
					{t("protocolWizard.manual.supplementsSection")}
				</h2>

				{addedSupplements.length > 0 ? (
					<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm px-md divide-y divide-edge-subtle">
						{addedSupplements.map((supplement) => (
							<SupplementRow
								key={supplement._id}
								supplement={supplement}
								timeBlocks={timeBlocks}
								onEdit={() => openEditSheet(supplement)}
								onDelete={() => deleteSupplement(supplement._id)}
							/>
						))}
					</div>
				) : (
					<p className="text-sm text-content-faint text-center py-lg">
						{t("protocolWizard.manual.noSupplementsYet")}
					</p>
				)}

				<Button
					type="button"
					variant="outline"
					onClick={openAddSheet}
					className="w-full flex items-center justify-center gap-sm rounded-xl border-edge border-dashed bg-surface-raised p-md h-12"
				>
					<Plus className="size-4 text-brand-500" />
					<span className="text-sm font-medium text-content">
						{t("protocolWizard.manual.addNewSupplement")}
					</span>
				</Button>

				{hasExisting && (
					<>
						<div className="flex items-center gap-sm">
							<div className="flex-1 h-px bg-edge-subtle" />
							<span className="text-xs text-content-faint uppercase tracking-wide">
								{t("protocolWizard.manual.or")}
							</span>
							<div className="flex-1 h-px bg-edge-subtle" />
						</div>

						<Button
							type="button"
							variant="outline"
							onClick={openPicker}
							className="w-full flex items-center justify-center gap-sm rounded-xl border-edge bg-surface-raised p-md h-12"
						>
							<Package className="size-4 text-brand-500" />
							<span className="text-sm font-medium text-content">
								{t("protocolWizard.manual.addFromExisting")}
							</span>
						</Button>
					</>
				)}
			</div>

			<Button
				type="button"
				onClick={handleSubmit}
				disabled={isPending}
				className="w-full bg-brand-500 text-content-inverse h-12 rounded-xl text-base font-semibold hover:bg-brand-600 active:scale-[0.98] transition-all duration-150"
			>
				{isPending ? t("protocolWizard.manual.saving") : t("protocolWizard.manual.saveAndPreview")}
			</Button>

			{hasExisting && (
				<ExistingSupplementPicker
					supplements={supplements}
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					onPick={openAddFromExisting}
				/>
			)}

			<PreviewSupplementSheet
				supplement={sheetState?.supplement ?? null}
				scheduleIndex={sheetState?.scheduleIndex ?? 0}
				defaultTimeBlockId={sheetState?.defaultTimeBlockId}
				timeBlocks={timeBlocks}
				packageSize={
					sheetState?.supplement?.existingSupplementId
						? (supplements.find((s) => s.id === sheetState.supplement?.existingSupplementId)
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
					if (!open) closeSheet();
				}}
				onSave={handleSheetSave}
				title={
					sheetState?.fromExisting ? t("protocolWizard.configureExistingSupplement") : undefined
				}
			/>
		</div>
	);
}
