"use client";

import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { SheetState } from "../../hooks/use-sheet-state";
import { findPackageSize, getTotalDailyDosage } from "../../lib/supplement-defaults";
import type { EditedSupplement } from "./parsed-preview.schema";
import { PreviewSupplementSheet } from "./preview-supplement-sheet";

type ConnectedSupplementSheetProps = {
	sheetState: SheetState;
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	onClose: () => void;
	onSave: (edited: EditedSupplement) => void;
};

export function ConnectedSupplementSheet({
	sheetState,
	existingSupplements,
	timeBlocks,
	onClose,
	onSave,
}: ConnectedSupplementSheetProps) {
	const t = useTranslations();

	return (
		<PreviewSupplementSheet
			supplement={sheetState?.supplement ?? null}
			scheduleIndex={sheetState?.scheduleIndex ?? 0}
			defaultTimeBlockId={sheetState?.defaultTimeBlockId}
			timeBlocks={timeBlocks}
			packageSize={findPackageSize(
				sheetState?.supplement?.existingSupplementId ?? null,
				existingSupplements,
			)}
			totalDailyDosage={
				sheetState?.supplement ? getTotalDailyDosage(sheetState.supplement.schedules) : undefined
			}
			open={sheetState !== null}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			onSave={onSave}
			title={sheetState?.fromExisting ? t("protocolWizard.configureExistingSupplement") : undefined}
		/>
	);
}
