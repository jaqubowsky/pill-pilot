"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createProtocol } from "@/features/protocol-wizard/api/actions/create-protocol";
import { deleteDraftProtocol } from "@/features/protocol-wizard/api/actions/delete-draft-protocol";
import { saveDraftProtocol } from "@/features/protocol-wizard/api/actions/save-draft-protocol";
import { updateProtocol } from "@/features/protocol-wizard/api/actions/update-protocol";
import type { ParsedProtocol } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { toDateString } from "@/shared/lib/date";
import { useBlockOrdering } from "../../hooks/use-block-ordering";
import { useSupplementCrud } from "../../hooks/use-supplement-crud";
import {
	type IdentifiedSupplement,
	toIdentifiedSupplements,
	toSerializedProtocol,
} from "../../lib/supplement-serialization";

type UseParsedPreviewParams = {
	protocolId: string;
	initialParsed: ParsedProtocol;
	timeBlocks: TimeBlockSummary[];
	mode: PreviewMode;
	initialStartDate?: string;
};

export const PreviewMode = { create: "create", edit: "edit" } as const;
export type PreviewMode = (typeof PreviewMode)[keyof typeof PreviewMode];

export function useParsedPreview({
	protocolId,
	initialParsed,
	timeBlocks,
	mode,
	initialStartDate,
}: UseParsedPreviewParams) {
	const router = useRouter();
	const [initialSupplements] = useState(() => toIdentifiedSupplements(initialParsed.supplements));
	const [protocolName] = useState(initialParsed.protocolName);
	const [startDate, setStartDate] = useState(() => initialStartDate ?? toDateString(new Date()));
	const [discardOpen, setDiscardOpen] = useState(false);
	const [priceSheetOpen, setPriceSheetOpen] = useState(false);
	const [newSupplementIds, setNewSupplementIds] = useState<string[]>([]);

	const { execute: saveDraft } = useAction(saveDraftProtocol, {
		onError: ({ error }) => toast.error(error.serverError),
	});

	function persistDraft(supps: IdentifiedSupplement[]) {
		if (mode === PreviewMode.edit) return;

		saveDraft({
			protocolId,
			name: protocolName,
			parsedData: toSerializedProtocol(protocolName, supps, { includeDraft: true }),
		});
	}

	const rebuildRef = useRef<(supps: IdentifiedSupplement[]) => void>(() => {});

	const crud = useSupplementCrud(initialSupplements, (next) => {
		rebuildRef.current(next);
		persistDraft(next);
	});

	const { blockMap, orderedBlocks, rebuildBlockOrders, handleDragEnd } = useBlockOrdering(
		initialSupplements,
		crud.supplements,
		timeBlocks,
	);

	rebuildRef.current = rebuildBlockOrders;

	const { execute: approveCreate, isPending: isCreating } = useAction(createProtocol, {
		onSuccess: ({ data }) => {
			const ids = data?.newSupplementIds ?? [];
			if (ids.length > 0) {
				setNewSupplementIds(ids);
				setPriceSheetOpen(true);
			} else {
				router.push("/dashboard");
			}
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: approveUpdate, isPending: isUpdating } = useAction(updateProtocol, {
		onSuccess: () => router.push("/dashboard"),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: executeDiscard, isPending: isDiscarding } = useAction(deleteDraftProtocol, {
		onSuccess: () => router.push("/dashboard"),
		onError: ({ error }) => toast.error(error.serverError),
	});

	function handleApprove() {
		const data = toSerializedProtocol(protocolName, crud.supplements);
		if (mode === PreviewMode.edit) {
			approveUpdate({ protocolId, parsedData: data, startDate });
		} else {
			approveCreate({ protocolId, parsedData: data, startDate });
		}
	}

	function handleDiscard() {
		executeDiscard({ protocolId });
	}

	function handlePriceSheetClose() {
		setPriceSheetOpen(false);
		router.push("/dashboard");
	}

	function onDragEnd(event: Parameters<typeof handleDragEnd>[0]) {
		handleDragEnd(event, () => persistDraft(crud.supplements));
	}

	return {
		protocolName,
		startDate,
		setStartDate,
		isApproving: isCreating || isUpdating,
		discardOpen,
		setDiscardOpen,
		isDiscarding,
		blockMap,
		orderedBlocks,
		priceSheetOpen,
		newSupplementIds,
		handleApprove,
		handleDiscard,
		handleDragEnd: onDragEnd,
		handlePriceSheetClose,
		...crud,
	};
}
