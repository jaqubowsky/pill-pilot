"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createProtocol } from "@/features/protocol-wizard/api/actions/create-protocol";
import { deleteDraftProtocol } from "@/features/protocol-wizard/api/actions/delete-draft-protocol";
import { saveDraftProtocol } from "@/features/protocol-wizard/api/actions/save-draft-protocol";
import {
	CONFIDENCE_THRESHOLD,
	type ParsedProtocol,
	type ParsedSupplement,
} from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { updateProtocol } from "@/features/settings/api/actions/update-protocol";
import type { EditedSupplement } from "./parsed-preview.schema";

export type IdentifiedSupplement = EditedSupplement & { _id: string; _removed?: boolean };

function convertFromParsed(supplements: ParsedSupplement[]): IdentifiedSupplement[] {
	return supplements.map((s) => ({
		...s,
		_id: crypto.randomUUID(),
	}));
}

function serializeForApproval(supplements: IdentifiedSupplement[]) {
	return supplements.filter((s) => !s._removed).map(({ _id, _removed, ...rest }) => rest);
}

function serializeForDraft(supplements: IdentifiedSupplement[]) {
	return supplements.map(({ _id, ...rest }) => rest);
}

function parseSortableId(id: string): { blockId: string; supId: string } | null {
	const colonIndex = id.indexOf(":");
	if (colonIndex === -1) return null;
	return { blockId: id.slice(0, colonIndex), supId: id.slice(colonIndex + 1) };
}

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
	const [initialSupplements] = useState(() => convertFromParsed(initialParsed.supplements));
	const [supplements, setSupplements] = useState<IdentifiedSupplement[]>(initialSupplements);
	const [protocolName] = useState(initialParsed.protocolName);
	const [startDate, setStartDate] = useState(
		() => initialStartDate ?? new Date().toISOString().slice(0, 10),
	);
	const [discardOpen, setDiscardOpen] = useState(false);

	const { execute: approveCreate, isPending: isCreating } = useAction(createProtocol, {
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: approveUpdate, isPending: isUpdating } = useAction(updateProtocol, {
		onError: ({ error }) => toast.error(error.serverError),
	});

	const isApproving = isCreating || isUpdating;

	const { execute: saveDraft } = useAction(saveDraftProtocol, {
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: executeDiscard, isPending: isDiscarding } = useAction(deleteDraftProtocol, {
		onSuccess: () => router.push("/dashboard"),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const unverifiedCount = supplements.filter(
		(s) => !s._removed && s.confidence < CONFIDENCE_THRESHOLD,
	).length;

	function persistDraft(supps: IdentifiedSupplement[]) {
		if (mode === PreviewMode.edit) return;
		saveDraft({
			protocolId,
			name: protocolName,
			parsedData: JSON.stringify({ protocolName, supplements: serializeForDraft(supps) }),
		});
	}

	function handleUpdateSupplement(id: string, updated: EditedSupplement) {
		const next = supplements.map((s) => (s._id === id ? { ...updated, _id: s._id } : s));
		setSupplements(next);
		rebuildBlockOrders(next);
		persistDraft(next);
	}

	function handleAddSupplement(supplement: EditedSupplement) {
		const next = [...supplements, { ...supplement, _id: crypto.randomUUID() }];
		setSupplements(next);
		rebuildBlockOrders(next);
		persistDraft(next);
	}

	function handleDeleteSupplement(id: string) {
		const next = supplements.map((s) => (s._id === id ? { ...s, _removed: true } : s));
		setSupplements(next);
		persistDraft(next);
	}

	function handleRestoreSupplement(id: string) {
		const next = supplements.map((s) => (s._id === id ? { ...s, _removed: false } : s));
		setSupplements(next);
		persistDraft(next);
	}

	function handleVerifySupplement(id: string) {
		const next = supplements.map((s) => (s._id === id ? { ...s, confidence: 1 } : s));
		setSupplements(next);
		persistDraft(next);
	}

	function handleDiscard() {
		executeDiscard({ protocolId });
	}

	function handleApprove() {
		const data = JSON.stringify({ protocolName, supplements: serializeForApproval(supplements) });
		if (mode === PreviewMode.edit) {
			approveUpdate({ protocolId, parsedData: data, startDate });
		} else {
			approveCreate({ protocolId, parsedData: data, startDate });
		}
	}

	function handleMoveToBlock(supplementId: string, scheduleIndex: number, newBlockId: string) {
		const next = supplements.map((s) => {
			if (s._id !== supplementId) return s;
			return {
				...s,
				schedules: s.schedules.map((sch, i) =>
					i === scheduleIndex ? { ...sch, timeBlockId: newBlockId } : sch,
				),
			};
		});
		setSupplements(next);
		rebuildBlockOrders(next);
		persistDraft(next);
	}

	const [blockOrders, setBlockOrders] = useState<Map<string, string[]>>(() => {
		const orders = new Map<string, string[]>();
		for (const supplement of initialSupplements) {
			for (const schedule of supplement.schedules) {
				const existing = orders.get(schedule.timeBlockId) ?? [];
				if (!existing.includes(supplement._id)) {
					existing.push(supplement._id);
					orders.set(schedule.timeBlockId, existing);
				}
			}
		}
		return orders;
	});

	function rebuildBlockOrders(supps: IdentifiedSupplement[]) {
		setBlockOrders((prev) => {
			const next = new Map<string, string[]>();
			for (const supplement of supps) {
				for (const schedule of supplement.schedules) {
					const prevOrder = prev.get(schedule.timeBlockId);
					const existing = next.get(schedule.timeBlockId) ?? [];
					if (!existing.includes(supplement._id)) {
						existing.push(supplement._id);
						next.set(schedule.timeBlockId, existing);
					}
				}
			}
			for (const [blockId, ids] of next) {
				const prevOrder = prev.get(blockId);
				if (prevOrder) {
					ids.sort((a, b) => {
						const ai = prevOrder.indexOf(a);
						const bi = prevOrder.indexOf(b);
						return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
					});
				}
			}
			return next;
		});
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			persistDraft(supplements);
			return;
		}

		const activeParsed = parseSortableId(String(active.id));
		const overParsed = parseSortableId(String(over.id));
		if (!activeParsed || !overParsed) return;
		if (activeParsed.blockId !== overParsed.blockId) return;

		const blockId = activeParsed.blockId;

		setBlockOrders((prev) => {
			const order = prev.get(blockId);
			if (!order) return prev;

			const oldIndex = order.indexOf(activeParsed.supId);
			const newIndex = order.indexOf(overParsed.supId);
			if (oldIndex === -1 || newIndex === -1) return prev;

			const next = new Map(prev);
			next.set(blockId, arrayMove(order, oldIndex, newIndex));
			return next;
		});

		persistDraft(supplements);
	}

	const blockMap = useMemo(() => {
		const map = new Map<string, IdentifiedSupplement[]>();
		const supMap = new Map(supplements.map((s) => [s._id, s]));

		for (const supplement of supplements) {
			const seenBlocks = new Set<string>();
			for (const schedule of supplement.schedules) {
				if (seenBlocks.has(schedule.timeBlockId)) continue;
				seenBlocks.add(schedule.timeBlockId);
				const existing = map.get(schedule.timeBlockId) ?? [];
				existing.push(supplement);
				map.set(schedule.timeBlockId, existing);
			}
		}

		for (const [blockId, supps] of map) {
			const order = blockOrders.get(blockId);
			if (order) {
				supps.sort((a, b) => {
					const ai = order.indexOf(a._id);
					const bi = order.indexOf(b._id);
					return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
				});
			}
		}

		return map;
	}, [supplements, blockOrders]);

	const orderedBlocks = timeBlocks.filter((tb) => blockMap.has(tb.id));

	return {
		protocolName,
		supplements,
		startDate,
		setStartDate,
		unverifiedCount,
		isApproving,
		discardOpen,
		setDiscardOpen,
		isDiscarding,
		blockMap,
		orderedBlocks,
		handleUpdateSupplement,
		handleAddSupplement,
		handleDeleteSupplement,
		handleRestoreSupplement,
		handleVerifySupplement,
		handleApprove,
		handleDiscard,
		handleDragEnd,
		handleMoveToBlock,
	};
}
