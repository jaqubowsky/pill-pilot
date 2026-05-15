import type { SheetState } from "../hooks/use-sheet-state";

export function isAddSupplementAction(sheetState: NonNullable<SheetState>): boolean {
	return sheetState.supplement === null || sheetState.fromExisting === true;
}
