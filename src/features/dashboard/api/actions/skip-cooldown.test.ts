import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDailyLogRepo, mockScheduleRepo, mockProtocolRepo } = vi.hoisted(() => ({
	mockDailyLogRepo: {
		findByDateAndScheduleIds: vi.fn(),
		updateById: vi.fn(),
	},
	mockScheduleRepo: {
		findSiblings: vi.fn(),
	},
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/repositories/daily-log-repository", () => ({ dailyLogRepository: mockDailyLogRepo }));
vi.mock("@/shared/repositories/supplement-schedule-repository", () => ({ supplementScheduleRepository: mockScheduleRepo }));
vi.mock("@/shared/repositories/protocol-repository", () => ({ protocolRepository: mockProtocolRepo }));

import { skipCooldown } from "./skip-cooldown";

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1" });
});

describe("skipCooldown", () => {
	it("verifies protocol ownership", async () => {
		mockScheduleRepo.findSiblings.mockResolvedValue([]);

		await skipCooldown({ protocolId: "proto-1", supplementId: "supp-1", date: "2025-03-01" });

		expect(mockProtocolRepo.findByIdAndUserId).toHaveBeenCalledWith("proto-1", "user-1");
	});

	it("returns early when no siblings", async () => {
		mockScheduleRepo.findSiblings.mockResolvedValue([]);

		await skipCooldown({ protocolId: "proto-1", supplementId: "supp-1", date: "2025-03-01" });

		expect(mockDailyLogRepo.findByDateAndScheduleIds).not.toHaveBeenCalled();
		expect(mockDailyLogRepo.updateById).not.toHaveBeenCalled();
	});

	it("returns early when no sibling logs", async () => {
		mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-1" }]);
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);

		await skipCooldown({ protocolId: "proto-1", supplementId: "supp-1", date: "2025-03-01" });

		expect(mockDailyLogRepo.updateById).not.toHaveBeenCalled();
	});

	it("updates most recent log with cooldownSkippedAt", async () => {
		mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-1" }, { id: "sib-2" }]);
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([
			{ id: "log-1", takenAt: new Date("2025-03-01T08:00:00Z") },
			{ id: "log-2", takenAt: new Date("2025-03-01T10:00:00Z") },
		]);

		await skipCooldown({ protocolId: "proto-1", supplementId: "supp-1", date: "2025-03-01" });

		expect(mockDailyLogRepo.updateById).toHaveBeenCalledWith("log-2", {
			cooldownSkippedAt: expect.any(Date),
		});
		expect(mockDailyLogRepo.updateById).toHaveBeenCalledTimes(1);
	});

	it("handles single sibling log (no reduce edge case)", async () => {
		mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-1" }]);
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([
			{ id: "log-1", takenAt: new Date("2025-03-01T08:00:00Z") },
		]);

		await skipCooldown({ protocolId: "proto-1", supplementId: "supp-1", date: "2025-03-01" });

		expect(mockDailyLogRepo.updateById).toHaveBeenCalledWith("log-1", {
			cooldownSkippedAt: expect.any(Date),
		});
	});

	it("passes correct sibling IDs to find logs", async () => {
		mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-A" }, { id: "sib-B" }]);
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);

		await skipCooldown({ protocolId: "proto-1", supplementId: "supp-1", date: "2025-03-01" });

		expect(mockDailyLogRepo.findByDateAndScheduleIds).toHaveBeenCalledWith(
			"2025-03-01",
			["sib-A", "sib-B"],
		);
	});
});
