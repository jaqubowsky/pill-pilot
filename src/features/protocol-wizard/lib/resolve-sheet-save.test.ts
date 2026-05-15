import { describe, expect, it } from "vitest";
import type { SheetState } from "../hooks/use-sheet-state";
import { isAddSupplementAction } from "./resolve-sheet-save";
import type { IdentifiedSupplement } from "./supplement-serialization";

const supplement = { _id: "abc" } as IdentifiedSupplement;

describe("isAddSupplementAction", () => {
	it("treats a blank add sheet (no supplement) as add", () => {
		const state: SheetState = { supplement: null, scheduleIndex: 0 };

		expect(isAddSupplementAction(state)).toBe(true);
	});

	it("treats a picker-prefilled supplement as add, not update", () => {
		const state: SheetState = {
			supplement,
			scheduleIndex: 0,
			fromExisting: true,
		};

		expect(isAddSupplementAction(state)).toBe(true);
	});

	it("treats editing an existing row as update", () => {
		const state: SheetState = { supplement, scheduleIndex: 0 };

		expect(isAddSupplementAction(state)).toBe(false);
	});
});
