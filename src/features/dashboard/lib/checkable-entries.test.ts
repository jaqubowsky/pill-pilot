import { describe, expect, it } from "vitest";
import { getCheckableEntries, getUncheckedIds } from "./checkable-entries";

const base = {
	scheduleId: "s1",
	isExpired: false,
	notStartedDays: null,
	phase: null,
	cycling: null,
	stockStatus: null,
	finishPackage: false,
	cooldown: null,
	logId: null,
};

describe("getCheckableEntries", () => {
	it("includes a normal active entry", () => {
		expect(getCheckableEntries([base])).toHaveLength(1);
	});

	it("excludes expired entries", () => {
		expect(getCheckableEntries([{ ...base, isExpired: true }])).toHaveLength(0);
	});

	it("excludes entries not yet started", () => {
		expect(getCheckableEntries([{ ...base, notStartedDays: 3 }])).toHaveLength(0);
	});

	it("excludes locked phase entries", () => {
		expect(getCheckableEntries([{ ...base, phase: { isUnlocked: false } }])).toHaveLength(0);
	});

	it("includes unlocked phase entries", () => {
		expect(getCheckableEntries([{ ...base, phase: { isUnlocked: true } }])).toHaveLength(1);
	});

	it("excludes off-cycle entries", () => {
		expect(getCheckableEntries([{ ...base, cycling: { isOnPhase: false } }])).toHaveLength(0);
	});

	it("excludes out-of-stock entries", () => {
		expect(
			getCheckableEntries([{ ...base, stockStatus: { currentStock: 0 } }]),
		).toHaveLength(0);
	});

	it("includes out-of-stock entries when finishPackage is true", () => {
		expect(
			getCheckableEntries([
				{ ...base, stockStatus: { currentStock: 0 }, finishPackage: true },
			]),
		).toHaveLength(1);
	});

	it("excludes entries with active cooldown", () => {
		expect(
			getCheckableEntries([{ ...base, cooldown: { remainingMs: 5000 } }]),
		).toHaveLength(0);
	});

	it("includes entries with expired cooldown", () => {
		expect(
			getCheckableEntries([{ ...base, cooldown: { remainingMs: 0 } }]),
		).toHaveLength(1);
	});
});

describe("getUncheckedIds", () => {
	it("returns only unchecked schedule IDs", () => {
		const entries = [
			{ ...base, scheduleId: "s1", logId: null },
			{ ...base, scheduleId: "s2", logId: "log1" },
			{ ...base, scheduleId: "s3", logId: null },
		];
		expect(getUncheckedIds(entries)).toEqual(["s1", "s3"]);
	});

	it("excludes non-checkable entries even if unchecked", () => {
		const entries = [
			{ ...base, scheduleId: "s1", logId: null },
			{ ...base, scheduleId: "s2", logId: null, isExpired: true },
		];
		expect(getUncheckedIds(entries)).toEqual(["s1"]);
	});

	it("returns empty when all checkable entries are checked", () => {
		const entries = [{ ...base, scheduleId: "s1", logId: "log1" }];
		expect(getUncheckedIds(entries)).toEqual([]);
	});
});
