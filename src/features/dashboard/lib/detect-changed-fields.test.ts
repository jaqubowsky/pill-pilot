import { describe, expect, it } from "vitest";
import { buildSyncPayload, detectChangedFields } from "./detect-changed-fields";

describe("detectChangedFields", () => {
	const fields = ["notes", "isCritical", "startDayOffset"] as const;

	it("returns empty when nothing changed", () => {
		const old = { notes: "hello", isCritical: false, startDayOffset: 0 };
		const new_ = { notes: "hello", isCritical: false, startDayOffset: 0 };
		expect(detectChangedFields(old, new_, [...fields])).toEqual([]);
	});

	it("returns only changed fields", () => {
		const old = { notes: "hello", isCritical: false, startDayOffset: 0 };
		const new_ = { notes: "updated", isCritical: false, startDayOffset: 5 };
		expect(detectChangedFields(old, new_, [...fields])).toEqual(["notes", "startDayOffset"]);
	});

	it("detects null to value change", () => {
		const old = { notes: null as string | null, isCritical: false, startDayOffset: 0 };
		const new_ = { notes: "new" as string | null, isCritical: false, startDayOffset: 0 };
		expect(detectChangedFields(old, new_, [...fields])).toEqual(["notes"]);
	});

	it("detects value to null change", () => {
		const old = { notes: "old" as string | null, isCritical: false, startDayOffset: 0 };
		const new_ = { notes: null as string | null, isCritical: false, startDayOffset: 0 };
		expect(detectChangedFields(old, new_, [...fields])).toEqual(["notes"]);
	});

	it("does not report unchanged null fields", () => {
		const old = { notes: null as string | null, isCritical: false, startDayOffset: 0 };
		const new_ = { notes: null as string | null, isCritical: false, startDayOffset: 0 };
		expect(detectChangedFields(old, new_, [...fields])).toEqual([]);
	});
});

describe("buildSyncPayload", () => {
	const source = { notes: "hello", isCritical: true, startDayOffset: 5, extra: "ignored" };

	it("returns only fields that exist in source", () => {
		const result = buildSyncPayload(["notes", "isCritical"], source);
		expect(result).toEqual({ notes: "hello", isCritical: true });
	});

	it("ignores unknown field names", () => {
		const result = buildSyncPayload(["notes", "hackerField"], source);
		expect(result).toEqual({ notes: "hello" });
	});

	it("returns empty object for empty changedFields", () => {
		expect(buildSyncPayload([], source)).toEqual({});
	});

	it("returns empty object when no changed fields exist in source", () => {
		expect(buildSyncPayload(["unknown1", "unknown2"], source)).toEqual({});
	});
});
