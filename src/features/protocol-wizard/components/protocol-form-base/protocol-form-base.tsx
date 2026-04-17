"use client";

import { Package, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { ConnectedSupplementSheet } from "../protocol-base/connected-supplement-sheet";
import { ExistingSupplementPicker } from "../protocol-base/existing-supplement-picker";
import { SupplementRow } from "./supplement-row";
import type { useProtocolFormBase } from "./use-protocol-form-base";

type ProtocolFormBaseProps = ReturnType<typeof useProtocolFormBase> & {
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	submitLabel: string;
	isPending: boolean;
	onSubmit: () => void;
};

export function ProtocolFormBase({
	protocolName,
	supplements,
	sheetState,
	pickerOpen,
	setPickerOpen,
	openPicker,
	openAddSheet,
	openAddFromExisting,
	openEditSheet,
	closeSheet,
	handleSheetSave,
	deleteSupplement,
	existingSupplements,
	timeBlocks,
	submitLabel,
	isPending,
	onSubmit,
}: ProtocolFormBaseProps) {
	const t = useTranslations();
	const hasExisting = existingSupplements.length > 0;

	return (
		<>
			<LabeledInput
				label={t("protocolWizard.manual.protocolName")}
				value={protocolName.name}
				onChange={(e) => protocolName.setName(e.target.value)}
				placeholder={t("protocolWizard.manual.protocolNamePlaceholder")}
				error={protocolName.error ?? undefined}
			/>

			<div className="flex flex-col gap-md">
				<h2 className="text-lg font-semibold text-content">
					{t("protocolWizard.manual.supplementsSection")}
				</h2>

				{supplements.length > 0 ? (
					<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm px-md divide-y divide-edge-subtle">
						{supplements.map((supplement) => (
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
					onClick={() => openAddSheet()}
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
				onClick={onSubmit}
				disabled={isPending}
				className="w-full bg-brand-500 text-content-inverse h-12 rounded-xl text-base font-semibold hover:bg-brand-600 active:scale-[0.98] transition-all duration-150"
			>
				{submitLabel}
			</Button>

			{hasExisting && (
				<ExistingSupplementPicker
					supplements={existingSupplements}
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					onPick={openAddFromExisting}
				/>
			)}

			<ConnectedSupplementSheet
				sheetState={sheetState}
				existingSupplements={existingSupplements}
				timeBlocks={timeBlocks}
				onClose={closeSheet}
				onSave={handleSheetSave}
			/>
		</>
	);
}
