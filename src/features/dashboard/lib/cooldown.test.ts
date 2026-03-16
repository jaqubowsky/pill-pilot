import { describe, expect, it } from "vitest";
import { isCooldownActive } from "./cooldown";

const T = (h: number, m = 0) =>
	new Date(`2025-01-10T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
const NOW = T(12).getTime();

describe("isCooldownActive", () => {
	it("returns false when no sibling logs", () => {
		expect(isCooldownActive([], 120, NOW)).toBe(false);
	});

	it("returns true when within cooldown window", () => {
		const logs = [{ takenAt: T(11), timerAdjustmentMinutes: null, cooldownSkippedAt: null }];
		expect(isCooldownActive(logs, 120, NOW)).toBe(true);
	});

	it("returns false when cooldown has expired", () => {
		const logs = [{ takenAt: T(9), timerAdjustmentMinutes: null, cooldownSkippedAt: null }];
		expect(isCooldownActive(logs, 120, NOW)).toBe(false);
	});

	it("returns false when cooldown was skipped", () => {
		const logs = [
			{ takenAt: T(11, 30), timerAdjustmentMinutes: null, cooldownSkippedAt: T(11, 45) },
		];
		expect(isCooldownActive(logs, 120, NOW)).toBe(false);
	});

	it("picks the most recent log from multiple siblings", () => {
		const logs = [
			{ takenAt: T(9), timerAdjustmentMinutes: null, cooldownSkippedAt: null },
			{ takenAt: T(11, 30), timerAdjustmentMinutes: null, cooldownSkippedAt: null },
			{ takenAt: T(10), timerAdjustmentMinutes: null, cooldownSkippedAt: null },
		];
		expect(isCooldownActive(logs, 120, NOW)).toBe(true);
	});

	it("applies positive timer adjustment extending window", () => {
		const logs = [{ takenAt: T(9, 30), timerAdjustmentMinutes: 60, cooldownSkippedAt: null }];
		expect(isCooldownActive(logs, 120, NOW)).toBe(true);
	});

	it("applies negative timer adjustment shrinking window", () => {
		const logs = [{ takenAt: T(11), timerAdjustmentMinutes: -60, cooldownSkippedAt: null }];
		expect(isCooldownActive(logs, 120, NOW)).toBe(false);
	});

	it("treats null timerAdjustmentMinutes as 0", () => {
		const logs = [{ takenAt: T(11), timerAdjustmentMinutes: null, cooldownSkippedAt: null }];
		expect(isCooldownActive(logs, 60, NOW)).toBe(false);
	});

	it("ignores cooldownSkippedAt on non-most-recent log", () => {
		const logs = [
			{ takenAt: T(10), timerAdjustmentMinutes: null, cooldownSkippedAt: T(10, 5) },
			{ takenAt: T(11, 30), timerAdjustmentMinutes: null, cooldownSkippedAt: null },
		];
		expect(isCooldownActive(logs, 120, NOW)).toBe(true);
	});

	it("returns false at exact expiry boundary (not >=)", () => {
		const logs = [{ takenAt: T(10), timerAdjustmentMinutes: null, cooldownSkippedAt: null }];
		expect(isCooldownActive(logs, 120, NOW)).toBe(false);
	});
});
