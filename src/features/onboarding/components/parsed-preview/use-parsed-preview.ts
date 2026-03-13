"use client";

import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createProtocol } from "@/features/onboarding/api/actions/create-protocol";
import { saveDraftProtocol } from "@/features/onboarding/api/actions/save-draft-protocol";
import type {
	ParsedProtocol,
	ParsedSupplement,
} from "@/features/onboarding/schemas/parsed-protocol-schema";
import type { TimeBlockSummary } from "@/features/onboarding/types";
import { updateProtocol } from "@/features/settings/api/actions/update-protocol";
import type { EditedSupplement } from "./parsed-preview.schema";

const CONFIDENCE_THRESHOLD = 0.7;
const BLOCK_PREFIX = "block:";

export type IdentifiedSupplement = EditedSupplement & { _id: string };

function convertFromParsed(supplements: ParsedSupplement[]): IdentifiedSupplement[] {
	const withIds = supplements.map((s) => ({
		...s,
		prerequisiteLocalId: null as string | null,
		_id: crypto.randomUUID(),
	}));
	const nameToId = new Map(withIds.map((s) => [s.name, s._id]));
	return withIds.map((s) => {
		const { prerequisiteName, ...rest } = s;
		if (prerequisiteName) {
			return { ...rest, prerequisiteLocalId: nameToId.get(prerequisiteName) ?? null };
		}
		return rest;
	});
}

function serializeForServer(supplements: IdentifiedSupplement[]) {
	const idToName = new Map(supplements.map((s) => [s._id, s.name]));
	return supplements.map(({ _id, prerequisiteLocalId, ...rest }) => ({
		...rest,
		prerequisiteName: prerequisiteLocalId ? (idToName.get(prerequisiteLocalId) ?? null) : null,
	}));
}

function buildBlockItems(supps: IdentifiedSupplement[]): Record<string, string[]> {
	const map: Record<string, string[]> = {};
	const assigned = new Set<string>();
	for (const s of supps) {
		for (const sch of s.schedules) {
			if (assigned.has(s._id)) continue;
			if (!map[sch.timeBlockId]) map[sch.timeBlockId] = [];
			map[sch.timeBlockId].push(s._id);
			assigned.add(s._id);
		}
	}
	return map;
}

function findContainerOfItem(
	blockItems: Record<string, string[]>,
	itemId: string,
): string | undefined {
	return Object.keys(blockItems).find((blockId) => blockItems[blockId].includes(itemId));
}

function resolveDropTarget(
	id: string,
	blockItems: Record<string, string[]>,
): { blockId: string; supId?: string } | null {
	if (id.startsWith(BLOCK_PREFIX)) {
		return { blockId: id.slice(BLOCK_PREFIX.length) };
	}
	const blockId = findContainerOfItem(blockItems, id);
	if (blockId) return { blockId, supId: id };
	return null;
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
	const [supplements, setSupplements] = useState<IdentifiedSupplement[]>(() =>
		convertFromParsed(initialParsed.supplements),
	);
	const [protocolName] = useState(initialParsed.protocolName);
	const [startDate, setStartDate] = useState(
		() => initialStartDate ?? new Date().toISOString().slice(0, 10),
	);

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

	const unverifiedCount = supplements.filter((s) => s.confidence < CONFIDENCE_THRESHOLD).length;

	function persistDraft(supps: IdentifiedSupplement[]) {
		if (mode === PreviewMode.edit) return;
		saveDraft({
			protocolId,
			name: protocolName,
			parsedData: JSON.stringify({ protocolName, supplements: serializeForServer(supps) }),
		});
	}

	function handleUpdateSupplement(id: string, updated: EditedSupplement) {
		const next = supplements.map((s) => (s._id === id ? { ...updated, _id: s._id } : s));
		setSupplements(next);
		persistDraft(next);
	}

	function handleAddSupplement(supplement: EditedSupplement) {
		const next = [...supplements, { ...supplement, _id: crypto.randomUUID() }];
		setSupplements(next);
		persistDraft(next);
	}

	function handleDeleteSupplement(id: string) {
		const next = supplements
			.filter((s) => s._id !== id)
			.map((s) =>
				s.prerequisiteLocalId === id ? { ...s, prerequisiteLocalId: null, delayDays: null } : s,
			);
		setSupplements(next);
		persistDraft(next);
	}

	function handleApprove() {
		const data = JSON.stringify({ protocolName, supplements: serializeForServer(supplements) });
		if (mode === PreviewMode.edit) {
			approveUpdate({ protocolId, parsedData: data, startDate });
		} else {
			approveCreate({ protocolId, parsedData: data, startDate });
		}
	}

	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const activeId = String(active.id);
		const overId = String(over.id);

		setSupplements((prev) => {
			const items = buildBlockItems(prev);
			const activeBlock = findContainerOfItem(items, activeId);
			const target = resolveDropTarget(overId, items);
			if (!activeBlock || !target || activeBlock === target.blockId) return prev;

			const sourceItems = items[activeBlock]!;
			const destItems = items[target.blockId] ?? [];
			const activeIndex = sourceItems.indexOf(activeId);
			if (activeIndex === -1) return prev;

			const newSourceItems = sourceItems.filter((id) => id !== activeId);

			let newDestItems: string[];
			if (target.supId) {
				const overIndex = destItems.indexOf(target.supId);
				newDestItems = [...destItems];
				newDestItems.splice(overIndex >= 0 ? overIndex : destItems.length, 0, activeId);
			} else {
				newDestItems = [...destItems, activeId];
			}

			const orderMap = new Map<string, { blockId: string; index: number }>();
			for (const [blockId, ids] of Object.entries({
				...items,
				[activeBlock]: newSourceItems,
				[target.blockId]: newDestItems,
			})) {
				ids.forEach((id, i) => orderMap.set(id, { blockId, index: i }));
			}

			return prev
				.map((s) => {
					const placement = orderMap.get(s._id);
					if (!placement) return s;
					const currentBlock = s.schedules[0]?.timeBlockId;
					if (currentBlock === placement.blockId) return s;
					return {
						...s,
						schedules: s.schedules.map((sch) =>
							sch.timeBlockId === currentBlock ? { ...sch, timeBlockId: placement.blockId } : sch,
						),
					};
				})
				.sort((a, b) => {
					const aPlace = orderMap.get(a._id);
					const bPlace = orderMap.get(b._id);
					if (!aPlace || !bPlace) return 0;
					if (aPlace.blockId !== bPlace.blockId) return 0;
					return aPlace.index - bPlace.index;
				});
		});
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			persistDraft(supplements);
			return;
		}

		const activeId = String(active.id);
		const overId = String(over.id);

		setSupplements((prev) => {
			const items = buildBlockItems(prev);
			const activeBlock = findContainerOfItem(items, activeId);
			const target = resolveDropTarget(overId, items);

			if (!activeBlock || !target) return prev;

			if (activeBlock === target.blockId && target.supId) {
				const blockSupps = prev.filter((s) =>
					s.schedules.some((sch) => sch.timeBlockId === activeBlock),
				);
				const oldIndex = blockSupps.findIndex((s) => s._id === activeId);
				const newIndex = blockSupps.findIndex((s) => s._id === target.supId);
				if (oldIndex === -1 || newIndex === -1) return prev;

				const reordered = arrayMove(blockSupps, oldIndex, newIndex);
				const blockIds = new Set(blockSupps.map((s) => s._id));
				const result: IdentifiedSupplement[] = [];
				let idx = 0;
				for (const s of prev) {
					if (blockIds.has(s._id)) {
						result.push(reordered[idx]!);
						idx++;
					} else {
						result.push(s);
					}
				}
				return result;
			}

			return prev;
		});

		setTimeout(() => persistDraft(supplements), 0);
	}

	const blockMap = useMemo(() => {
		const map = new Map<string, IdentifiedSupplement[]>();
		const assigned = new Set<string>();
		for (const supplement of supplements) {
			for (const schedule of supplement.schedules) {
				if (assigned.has(supplement._id)) continue;
				assigned.add(supplement._id);
				const existing = map.get(schedule.timeBlockId) ?? [];
				existing.push(supplement);
				map.set(schedule.timeBlockId, existing);
			}
		}
		for (const [key, arr] of map) {
			map.set(
				key,
				arr.sort((a, b) => Number(b.isCritical) - Number(a.isCritical)),
			);
		}
		return map;
	}, [supplements]);

	const orderedBlocks = timeBlocks.filter((tb) => blockMap.has(tb.id));

	return {
		protocolName,
		supplements,
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
	};
}
