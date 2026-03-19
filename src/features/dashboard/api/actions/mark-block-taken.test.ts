import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDailyLogRepo, mockSupplementRepo, mockScheduleRepo } = vi.hoisted(() => ({
	mockDailyLogRepo: {
		findByDateAndScheduleIds: vi.fn(),
		create: vi.fn(),
	},
	mockSupplementRepo: {
		findByIdAndUserId: vi.fn(),
		decrementStock: vi.fn(),
	},
	mockScheduleRepo: {
		findOwned: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/repositories/daily-log-repository", () => ({ dailyLogRepository: mockDailyLogRepo }));
vi.mock("@/shared/repositories/supplement-repository", () => ({ supplementRepository: mockSupplementRepo }));
vi.mock("@/shared/repositories/supplement-schedule-repository", () => ({ supplementScheduleRepository: mockScheduleRepo }));

import { markBlockTaken } from "./mark-block-taken";

beforeEach(() => {
	vi.clearAllMocks();
	mockDailyLogRepo.create.mockResolvedValue({ id: "log-new" });
});

describe("markBlockTaken", () => {
	it("skips already checked schedules entirely", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([
			{ scheduleId: "s1" },
			{ scheduleId: "s2" },
		]);

		const result = await markBlockTaken({ scheduleIds: ["s1", "s2"], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 0 });
		expect(mockScheduleRepo.findOwned).not.toHaveBeenCalled();
	});

	it("skips supplements with zero stock (silent skip)", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);
		mockScheduleRepo.findOwned.mockResolvedValue({ id: "s1", supplementId: "supp-1", dosageAmount: "1" });
		mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-1", currentStock: "0" });

		const result = await markBlockTaken({ scheduleIds: ["s1"], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 0 });
		expect(mockDailyLogRepo.create).not.toHaveBeenCalled();
		expect(mockSupplementRepo.decrementStock).not.toHaveBeenCalled();
	});

	it("creates logs and decrements stock for unchecked items with stock", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([{ scheduleId: "s1" }]);
		mockScheduleRepo.findOwned.mockResolvedValue({ id: "s2", supplementId: "supp-2", dosageAmount: "1" });
		mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-2", currentStock: "10" });

		const result = await markBlockTaken({ scheduleIds: ["s1", "s2"], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 1 });
		expect(mockDailyLogRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ scheduleId: "s2", date: "2025-03-01", takenAt: expect.any(Date) }),
		);
		expect(mockSupplementRepo.decrementStock).toHaveBeenCalledWith("supp-2", "1");
	});

	it("allows untracked supplements (null stock)", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);
		mockScheduleRepo.findOwned.mockResolvedValue({ id: "s1", supplementId: "supp-1", dosageAmount: "1" });
		mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-1", currentStock: null });

		const result = await markBlockTaken({ scheduleIds: ["s1"], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 1 });
		expect(mockDailyLogRepo.create).toHaveBeenCalledTimes(1);
		expect(mockSupplementRepo.decrementStock).toHaveBeenCalledWith("supp-1", "1");
	});

	it("handles empty scheduleIds", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);

		const result = await markBlockTaken({ scheduleIds: [], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 0 });
	});

	it("processes multiple unchecked schedules with per-schedule mocks", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);
		mockScheduleRepo.findOwned
			.mockResolvedValueOnce({ id: "s1", supplementId: "supp-1", dosageAmount: "1" })
			.mockResolvedValueOnce({ id: "s2", supplementId: "supp-2", dosageAmount: "3" });
		mockSupplementRepo.findByIdAndUserId
			.mockResolvedValueOnce({ id: "supp-1", currentStock: "10" })
			.mockResolvedValueOnce({ id: "supp-2", currentStock: "0" });

		const result = await markBlockTaken({ scheduleIds: ["s1", "s2"], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 1 });
		expect(mockSupplementRepo.decrementStock).toHaveBeenCalledWith("supp-1", "1");
		expect(mockSupplementRepo.decrementStock).not.toHaveBeenCalledWith("supp-2", "3");
	});

	it("verifies ownership for each unchecked schedule", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);
		mockScheduleRepo.findOwned.mockResolvedValue({ id: "s1", supplementId: "supp-1", dosageAmount: "1" });
		mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-1", currentStock: "10" });

		await markBlockTaken({ scheduleIds: ["s1"], date: "2025-03-01" });

		expect(mockScheduleRepo.findOwned).toHaveBeenCalledWith("s1", "user-1");
		expect(mockSupplementRepo.findByIdAndUserId).toHaveBeenCalledWith("supp-1", "user-1");
	});

	it("does not enforce cooldown (design: batch check skips cooldown)", async () => {
		mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);
		mockScheduleRepo.findOwned.mockResolvedValue({ id: "s1", supplementId: "supp-1", dosageAmount: "1" });
		mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-1", currentStock: "10" });

		const result = await markBlockTaken({ scheduleIds: ["s1"], date: "2025-03-01" });

		expect(result).toEqual({ checkedCount: 1 });
	});
});
