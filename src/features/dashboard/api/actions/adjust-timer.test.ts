import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDailyLogRepo } = vi.hoisted(() => ({
	mockDailyLogRepo: {
		findOwnedById: vi.fn(),
		updateById: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/repositories/daily-log-repository", () => ({
	dailyLogRepository: mockDailyLogRepo,
}));

import { adjustTimer } from "./adjust-timer";

beforeEach(() => vi.clearAllMocks());

describe("adjustTimer", () => {
	it("accumulates positive adjustment", async () => {
		mockDailyLogRepo.findOwnedById.mockResolvedValue({
			id: "log-1",
			timerAdjustmentMinutes: 5,
		});

		await adjustTimer({ logId: "log-1", adjustmentMinutes: 10 });

		expect(mockDailyLogRepo.updateById).toHaveBeenCalledWith("log-1", {
			timerAdjustmentMinutes: 15,
		});
	});

	it("accumulates negative adjustment", async () => {
		mockDailyLogRepo.findOwnedById.mockResolvedValue({
			id: "log-1",
			timerAdjustmentMinutes: 10,
		});

		await adjustTimer({ logId: "log-1", adjustmentMinutes: -3 });

		expect(mockDailyLogRepo.updateById).toHaveBeenCalledWith("log-1", {
			timerAdjustmentMinutes: 7,
		});
	});

	it("handles null timerAdjustmentMinutes as 0", async () => {
		mockDailyLogRepo.findOwnedById.mockResolvedValue({
			id: "log-1",
			timerAdjustmentMinutes: null,
		});

		await adjustTimer({ logId: "log-1", adjustmentMinutes: 5 });

		expect(mockDailyLogRepo.updateById).toHaveBeenCalledWith("log-1", {
			timerAdjustmentMinutes: 5,
		});
	});
});
