"use client";

import { useState } from "react";
import { CONFIDENCE_THRESHOLD } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import type { EditedSupplement } from "../components/protocol-base/parsed-preview.schema";
import type { IdentifiedSupplement } from "../lib/supplement-serialization";

type OnChange = (next: IdentifiedSupplement[]) => void;

export function useSupplementCrud(initialSupplements: IdentifiedSupplement[], onChange?: OnChange) {
	const [supplements, setSupplements] = useState<IdentifiedSupplement[]>(initialSupplements);

	function apply(next: IdentifiedSupplement[]) {
		setSupplements(next);
		onChange?.(next);
	}

	function updateSupplement(id: string, updated: EditedSupplement) {
		apply(supplements.map((s) => (s._id === id ? { ...updated, _id: s._id } : s)));
	}

	function addSupplement(supplement: EditedSupplement) {
		apply([...supplements, { ...supplement, _id: crypto.randomUUID() }]);
	}

	function deleteSupplement(id: string) {
		apply(supplements.map((s) => (s._id === id ? { ...s, _removed: true } : s)));
	}

	function restoreSupplement(id: string) {
		apply(supplements.map((s) => (s._id === id ? { ...s, _removed: false } : s)));
	}

	function verifySupplement(id: string) {
		apply(supplements.map((s) => (s._id === id ? { ...s, confidence: 1 } : s)));
	}

	function moveToBlock(supplementId: string, scheduleIndex: number, newBlockId: string) {
		apply(
			supplements.map((s) => {
				if (s._id !== supplementId) return s;
				return {
					...s,
					schedules: s.schedules.map((sch, i) =>
						i === scheduleIndex ? { ...sch, timeBlockId: newBlockId } : sch,
					),
				};
			}),
		);
	}

	const unverified = supplements.filter((s) => !s._removed && s.confidence < CONFIDENCE_THRESHOLD);

	return {
		supplements,
		unverifiedCount: unverified.length,
		firstUnverifiedId: unverified[0]?._id ?? null,
		updateSupplement,
		addSupplement,
		deleteSupplement,
		restoreSupplement,
		verifySupplement,
		moveToBlock,
	};
}
