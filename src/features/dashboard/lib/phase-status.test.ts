import { describe, expect, it } from "vitest";
import { getPhaseStatus } from "./phase-status";

describe("getPhaseStatus", () => {
	it("returns no phase when protocolStartDate is null", () => {
		expect(getPhaseStatus(5, 10, null, "2025-01-10")).toEqual({
			isPhased: false,
			isExpired: false,
		});
	});

	it("returns no phase when startDayOffset is 0", () => {
		expect(getPhaseStatus(0, null, "2025-01-01", "2025-01-10")).toEqual({
			isPhased: false,
			isExpired: false,
		});
	});

	it("returns locked phase before offset reached", () => {
		expect(getPhaseStatus(10, null, "2025-01-01", "2025-01-05")).toEqual({
			isPhased: true,
			isUnlocked: false,
			daysRemaining: 6,
			isExpired: false,
		});
	});

	it("returns unlocked phase after offset reached", () => {
		expect(getPhaseStatus(5, null, "2025-01-01", "2025-01-10")).toEqual({
			isPhased: true,
			isUnlocked: true,
			daysRemaining: 0,
			isExpired: false,
		});
	});

	it("returns unlocked on exact offset day", () => {
		expect(getPhaseStatus(5, null, "2025-01-01", "2025-01-06")).toEqual({
			isPhased: true,
			isUnlocked: true,
			daysRemaining: 0,
			isExpired: false,
		});
	});

	it("returns expired when past offset + duration", () => {
		expect(getPhaseStatus(5, 10, "2025-01-01", "2025-01-20")).toEqual({
			isPhased: false,
			isExpired: true,
		});
	});

	it("returns expired on exact end day", () => {
		expect(getPhaseStatus(5, 10, "2025-01-01", "2025-01-16")).toEqual({
			isPhased: false,
			isExpired: true,
		});
	});

	it("returns not expired one day before end", () => {
		expect(getPhaseStatus(5, 10, "2025-01-01", "2025-01-15")).toEqual({
			isPhased: true,
			isUnlocked: true,
			daysRemaining: 0,
			isExpired: false,
		});
	});

	it("returns not phased but can expire when startDayOffset=0 with durationDays (pre-expiry)", () => {
		expect(getPhaseStatus(0, 10, "2025-01-01", "2025-01-05")).toEqual({
			isPhased: false,
			isExpired: false,
		});
	});

	it("returns expired when startDayOffset=0 with durationDays (post-expiry)", () => {
		expect(getPhaseStatus(0, 10, "2025-01-01", "2025-01-15")).toEqual({
			isPhased: false,
			isExpired: true,
		});
	});

	it("expiration takes precedence over locked phase", () => {
		expect(getPhaseStatus(100, 5, "2025-01-01", "2025-06-01")).toEqual({
			isPhased: false,
			isExpired: true,
		});
	});

	it("treats durationDays=0 as immediately expired on start day", () => {
		const result = getPhaseStatus(0, 0, "2025-01-01", "2025-01-01");
		expect(result).toEqual({ isPhased: false, isExpired: true });
	});
});
