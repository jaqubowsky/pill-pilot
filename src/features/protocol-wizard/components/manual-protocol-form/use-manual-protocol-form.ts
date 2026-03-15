"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ParsedProtocol } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import { createDraftProtocol } from "../../api/actions/create-draft-protocol";
import type { EditedSupplement } from "../parsed-preview/parsed-preview.schema";
import type { IdentifiedSupplement } from "../parsed-preview/use-parsed-preview";

type SheetState = {
	supplement: IdentifiedSupplement | null;
	scheduleIndex: number;
	defaultTimeBlockId?: string;
	fromExisting?: boolean;
} | null;

type UseManualProtocolFormParams = {
	timeBlocks: TimeBlockSummary[];
	t: (key: string) => string;
};

function buildDefaultSupplement(timeBlockId: string): EditedSupplement {
	return {
		name: "",
		existingSupplementId: null,
		brandName: null,
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
				timeBlockId,
			},
		],
	};
}

function toProtocolJson(protocolName: string, supplements: IdentifiedSupplement[]): ParsedProtocol {
	return {
		protocolName,
		supplements: supplements.map((s) => ({
			name: s.name,
			existingSupplementId: s.existingSupplementId,
			brandName: s.brandName,
			category: s.category,
			isCritical: s.isCritical,
			notes: s.notes,
			cycleDaysOn: s.cycleDaysOn,
			cycleDaysOff: s.cycleDaysOff,
			startDayOffset: s.startDayOffset,
			durationDays: s.durationDays,
			dosageIntervalMinutes: s.dosageIntervalMinutes ?? null,
			waitAfterTakingMinutes: s.waitAfterTakingMinutes ?? null,
			confidence: s.confidence,
			uncertaintyReason: s.uncertaintyReason,
			schedules: s.schedules,
		})),
	};
}

export function useManualProtocolForm({ timeBlocks, t }: UseManualProtocolFormParams) {
	const router = useRouter();
	const defaultTimeBlockId = timeBlocks[0]?.id ?? "";

	const [protocolName, setProtocolName] = useState("");
	const [supplements, setSupplements] = useState<IdentifiedSupplement[]>([]);
	const [sheetState, setSheetState] = useState<SheetState>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [protocolNameError, setProtocolNameError] = useState<string | null>(null);

	const { execute: executeSave, isPending } = useAction(createDraftProtocol, {
		onSuccess: ({ data }) => {
			if (data?.protocol) {
				toast.success(t("protocolWizard.manual.draftSaved"));
				router.push(`/protocol/new/preview/${data.protocol.id}`);
			}
		},
		onError: () => {
			toast.error(t("errors.generic"));
		},
	});

	const openAddSheet = useCallback(() => {
		setSheetState({
			supplement: null,
			scheduleIndex: 0,
			defaultTimeBlockId,
		});
	}, [defaultTimeBlockId]);

	const openPicker = useCallback(() => {
		setPickerOpen(true);
	}, []);

	const openAddFromExisting = useCallback(
		(existing: ExistingSupplementSummary) => {
			setPickerOpen(false);
			const prefilled: IdentifiedSupplement = {
				...buildDefaultSupplement(defaultTimeBlockId),
				name: existing.name,
				brandName: existing.brandName,
				existingSupplementId: existing.id,
				_id: crypto.randomUUID(),
			};
			setSheetState({
				supplement: prefilled,
				scheduleIndex: 0,
				fromExisting: true,
			});
		},
		[defaultTimeBlockId],
	);

	const openEditSheet = useCallback((supplement: IdentifiedSupplement) => {
		setSheetState({
			supplement,
			scheduleIndex: 0,
		});
	}, []);

	const closeSheet = useCallback(() => {
		setSheetState(null);
	}, []);

	function handleSheetSave(edited: EditedSupplement) {
		if (sheetState === null) return;

		if (sheetState.supplement === null) {
			setSupplements((prev) => [...prev, { ...edited, _id: crypto.randomUUID() }]);
		} else {
			const id = sheetState.supplement._id;
			const exists = supplements.some((s) => s._id === id);
			if (exists) {
				setSupplements((prev) => prev.map((s) => (s._id === id ? { ...edited, _id: id } : s)));
			} else {
				setSupplements((prev) => [...prev, { ...edited, _id: id }]);
			}
		}
	}

	function deleteSupplement(id: string) {
		setSupplements((prev) => prev.filter((s) => s._id !== id));
	}

	function handleSubmit() {
		setProtocolNameError(null);

		if (!protocolName.trim()) {
			setProtocolNameError(t("protocolWizard.manual.protocolNameRequired"));
			return;
		}

		if (supplements.length === 0) {
			toast.error(t("protocolWizard.manual.addAtLeastOneSupplement"));
			return;
		}

		const parsed = toProtocolJson(protocolName, supplements);
		executeSave({
			name: protocolName,
			parsedData: JSON.stringify(parsed),
		});
	}

	return {
		protocolName,
		setProtocolName,
		protocolNameError,
		supplements,
		sheetState,
		isPending,
		pickerOpen,
		setPickerOpen,
		openPicker,
		openAddSheet,
		openAddFromExisting,
		openEditSheet,
		closeSheet,
		handleSheetSave,
		deleteSupplement,
		handleSubmit,
	};
}
