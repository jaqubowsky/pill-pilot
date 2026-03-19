"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { IdentifiedSupplement } from "../lib/supplement-serialization";

function parseSortableId(id: string): { blockId: string; supId: string } | null {
	const colonIndex = id.indexOf(":");
	if (colonIndex === -1) return null;
	return { blockId: id.slice(0, colonIndex), supId: id.slice(colonIndex + 1) };
}

function buildBlockOrderMap(supplements: IdentifiedSupplement[]): Map<string, string[]> {
	const orders = new Map<string, string[]>();
	for (const supplement of supplements) {
		for (const schedule of supplement.schedules) {
			const existing = orders.get(schedule.timeBlockId) ?? [];
			if (!existing.includes(supplement._id)) {
				existing.push(supplement._id);
				orders.set(schedule.timeBlockId, existing);
			}
		}
	}
	return orders;
}

function sortByOrder(ids: string[], prevOrder: string[] | undefined): void {
	if (!prevOrder) return;
	ids.sort((a, b) => {
		const ai = prevOrder.indexOf(a);
		const bi = prevOrder.indexOf(b);
		return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
	});
}

export function useBlockOrdering(
	initialSupplements: IdentifiedSupplement[],
	supplements: IdentifiedSupplement[],
	timeBlocks: TimeBlockSummary[],
) {
	const [blockOrders, setBlockOrders] = useState<Map<string, string[]>>(() =>
		buildBlockOrderMap(initialSupplements),
	);

	function rebuildBlockOrders(supps: IdentifiedSupplement[]) {
		setBlockOrders((prev) => {
			const next = buildBlockOrderMap(supps);
			for (const [blockId, ids] of next) {
				sortByOrder(ids, prev.get(blockId));
			}
			return next;
		});
	}

	function handleDragEnd(event: DragEndEvent, onDragComplete: () => void) {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			onDragComplete();
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

		onDragComplete();
	}

	const blockMap = useMemo(() => {
		const map = new Map<string, IdentifiedSupplement[]>();

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

	return { blockMap, orderedBlocks, rebuildBlockOrders, handleDragEnd };
}
