import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDailyLogRepo, mockSupplementRepo, mockScheduleRepo } = vi.hoisted(() => ({
	mockDailyLogRepo: {
		findByScheduleAndDate: vi.fn(),
		deleteByScheduleAndDate: vi.fn(),
	},
	mockSupplementRepo: {
		incrementStock: vi.fn(),
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

import { markUntaken } from "./mark-untaken";

const schedule = {
	id: "sched-1",
	supplementId: "supp-1",
	dosageAmount: "2",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockScheduleRepo.findOwned.mockResolvedValue(schedule);
});

describe("markUntaken", () => {
	it("verifies schedule ownership", async () => {
		mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue(undefined);

		await markUntaken({ scheduleId: "sched-1", date: "2025-03-01" });

		expect(mockScheduleRepo.findOwned).toHaveBeenCalledWith("sched-1", "user-1");
	});

	it("returns success without changes when no existing log", async () => {
		mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue(undefined);

		const result = await markUntaken({ scheduleId: "sched-1", date: "2025-03-01" });

		expect(result).toEqual({ success: true });
		expect(mockDailyLogRepo.deleteByScheduleAndDate).not.toHaveBeenCalled();
		expect(mockSupplementRepo.incrementStock).not.toHaveBeenCalled();
	});

	it("deletes log and increments stock when log exists", async () => {
		mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue({ id: "log-1" });

		const result = await markUntaken({ scheduleId: "sched-1", date: "2025-03-01" });

		expect(result).toEqual({ success: true });
		expect(mockDailyLogRepo.deleteByScheduleAndDate).toHaveBeenCalledWith("sched-1", "2025-03-01");
		expect(mockSupplementRepo.incrementStock).toHaveBeenCalledWith("supp-1", "2");
	});

	it("uses dosageAmount from schedule for stock increment", async () => {
		mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, dosageAmount: "0.5" });
		mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue({ id: "log-1" });

		await markUntaken({ scheduleId: "sched-1", date: "2025-03-01" });

		expect(mockSupplementRepo.incrementStock).toHaveBeenCalledWith("supp-1", "0.5");
	});

	it("always increments stock even for untracked supplements (repo handles null check)", async () => {
		mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue({ id: "log-1" });

		await markUntaken({ scheduleId: "sched-1", date: "2025-03-01" });

		expect(mockSupplementRepo.incrementStock).toHaveBeenCalledWith("supp-1", "2");
	});
});
