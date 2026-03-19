import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDailyLogRepo, mockSupplementRepo, mockScheduleRepo } = vi.hoisted(() => ({
	mockDailyLogRepo: {
		findByScheduleAndDate: vi.fn(),
		findByDateAndScheduleIds: vi.fn(),
		create: vi.fn(),
	},
	mockSupplementRepo: {
		findByIdAndUserId: vi.fn(),
		findById: vi.fn(),
		decrementStock: vi.fn(),
	},
	mockScheduleRepo: {
		findOwned: vi.fn(),
		findSiblings: vi.fn(),
		deactivateFinishPackageBySupplementId: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/repositories/daily-log-repository", () => ({
	dailyLogRepository: mockDailyLogRepo,
}));
vi.mock("@/shared/repositories/supplement-repository", () => ({
	supplementRepository: mockSupplementRepo,
}));
vi.mock("@/shared/repositories/supplement-schedule-repository", () => ({
	supplementScheduleRepository: mockScheduleRepo,
}));
vi.mock("@/features/dashboard/lib/cooldown", () => ({ isCooldownActive: vi.fn(() => false) }));

import { isCooldownActive } from "@/features/dashboard/lib/cooldown";
import { markTaken } from "./mark-taken";

const schedule = {
	id: "sched-1",
	protocolId: "proto-1",
	supplementId: "supp-1",
	dosageAmount: "2",
	finishPackage: false,
};

const supplement = {
	id: "supp-1",
	currentStock: "30",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockScheduleRepo.findOwned.mockResolvedValue(schedule);
	mockSupplementRepo.findByIdAndUserId.mockResolvedValue(supplement);
	mockSupplementRepo.findById.mockResolvedValue(supplement);
	mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue(undefined);
	mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);
	mockDailyLogRepo.create.mockResolvedValue({ id: "log-1" });
	mockScheduleRepo.findSiblings.mockResolvedValue([]);
});

describe("markTaken", () => {
	describe("idempotency", () => {
		it("returns existing logId without touching schedule or stock", async () => {
			mockDailyLogRepo.findByScheduleAndDate.mockResolvedValue({ id: "existing-log" });

			const result = await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(result).toEqual({ logId: "existing-log" });
			expect(mockScheduleRepo.findOwned).not.toHaveBeenCalled();
			expect(mockSupplementRepo.findByIdAndUserId).not.toHaveBeenCalled();
			expect(mockDailyLogRepo.create).not.toHaveBeenCalled();
			expect(mockSupplementRepo.decrementStock).not.toHaveBeenCalled();
		});
	});

	describe("stock validation", () => {
		it("throws OUT_OF_STOCK when currentStock is 0", async () => {
			mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ ...supplement, currentStock: "0" });

			await expect(markTaken({ scheduleId: "sched-1", date: "2025-03-01" })).rejects.toThrow(
				"OUT_OF_STOCK",
			);
			expect(mockDailyLogRepo.create).not.toHaveBeenCalled();
		});

		it("throws OUT_OF_STOCK when currentStock is negative", async () => {
			mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ ...supplement, currentStock: "-1" });

			await expect(markTaken({ scheduleId: "sched-1", date: "2025-03-01" })).rejects.toThrow(
				"OUT_OF_STOCK",
			);
		});

		it("allows marking when currentStock is null (untracked)", async () => {
			mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ ...supplement, currentStock: null });

			const result = await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(result).toEqual({ logId: "log-1" });
			expect(mockSupplementRepo.decrementStock).toHaveBeenCalled();
		});

		it("allows fractional stock (0.5 remaining)", async () => {
			mockSupplementRepo.findByIdAndUserId.mockResolvedValue({
				...supplement,
				currentStock: "0.5",
			});
			mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, dosageAmount: "0.25" });

			const result = await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(result).toEqual({ logId: "log-1" });
			expect(mockSupplementRepo.decrementStock).toHaveBeenCalledWith("supp-1", "0.25");
		});
	});

	describe("cooldown enforcement", () => {
		it("throws COOLDOWN_ACTIVE when cooldown is active", async () => {
			mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-1", dosageIntervalMinutes: 60 }]);
			mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([
				{ takenAt: new Date(), timerAdjustmentMinutes: null, cooldownSkippedAt: null },
			]);
			vi.mocked(isCooldownActive).mockReturnValue(true);

			await expect(markTaken({ scheduleId: "sched-1", date: "2025-03-01" })).rejects.toThrow(
				"COOLDOWN_ACTIVE",
			);
			expect(mockDailyLogRepo.create).not.toHaveBeenCalled();
		});

		it("skips cooldown check when siblings have no dosageIntervalMinutes", async () => {
			mockScheduleRepo.findSiblings.mockResolvedValue([
				{ id: "sib-1", dosageIntervalMinutes: null },
			]);

			const result = await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(result).toEqual({ logId: "log-1" });
			expect(mockDailyLogRepo.findByDateAndScheduleIds).not.toHaveBeenCalled();
		});

		it("skips cooldown check when no sibling logs exist", async () => {
			mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-1", dosageIntervalMinutes: 60 }]);
			mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);

			const result = await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(result).toEqual({ logId: "log-1" });
			expect(isCooldownActive).not.toHaveBeenCalled();
		});

		it("passes correct sibling IDs to find logs", async () => {
			mockScheduleRepo.findSiblings.mockResolvedValue([
				{ id: "sib-1", dosageIntervalMinutes: 120 },
				{ id: "sib-2", dosageIntervalMinutes: 120 },
			]);
			mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([]);

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockDailyLogRepo.findByDateAndScheduleIds).toHaveBeenCalledWith("2025-03-01", [
				"sib-1",
				"sib-2",
			]);
		});

		it("reads dosageIntervalMinutes from first sibling only", async () => {
			mockScheduleRepo.findSiblings.mockResolvedValue([
				{ id: "sib-1", dosageIntervalMinutes: 60 },
				{ id: "sib-2", dosageIntervalMinutes: 120 },
			]);
			const log = { takenAt: new Date(), timerAdjustmentMinutes: null, cooldownSkippedAt: null };
			mockDailyLogRepo.findByDateAndScheduleIds.mockResolvedValue([log]);
			vi.mocked(isCooldownActive).mockReturnValue(false);

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(isCooldownActive).toHaveBeenCalledWith([log], 60, expect.any(Number));
		});

		it("skips cooldown when dosageIntervalMinutes is 0 (falsy)", async () => {
			mockScheduleRepo.findSiblings.mockResolvedValue([{ id: "sib-1", dosageIntervalMinutes: 0 }]);

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockDailyLogRepo.findByDateAndScheduleIds).not.toHaveBeenCalled();
		});
	});

	describe("log creation", () => {
		it("passes correct scheduleId and date to findOwned", async () => {
			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockScheduleRepo.findOwned).toHaveBeenCalledWith("sched-1", "user-1");
		});

		it("passes schedule.supplementId to findByIdAndUserId", async () => {
			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockSupplementRepo.findByIdAndUserId).toHaveBeenCalledWith("supp-1", "user-1");
		});

		it("creates log and decrements stock on success", async () => {
			const result = await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(result).toEqual({ logId: "log-1" });
			expect(mockDailyLogRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					scheduleId: "sched-1",
					date: "2025-03-01",
					takenAt: expect.any(Date),
				}),
			);
			expect(mockSupplementRepo.decrementStock).toHaveBeenCalledWith("supp-1", "2");
		});

		it("sets timerNotifiedAt when skipTimer is true", async () => {
			await markTaken({ scheduleId: "sched-1", date: "2025-03-01", skipTimer: true });

			const createCall = mockDailyLogRepo.create.mock.calls[0][0];
			expect(createCall.timerNotifiedAt).toBeInstanceOf(Date);
		});

		it("does not set timerNotifiedAt when skipTimer is falsy", async () => {
			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			const createCall = mockDailyLogRepo.create.mock.calls[0][0];
			expect(createCall.timerNotifiedAt).toBeUndefined();
		});
	});

	describe("finishPackage", () => {
		it("deactivates schedules when stock hits 0", async () => {
			mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, finishPackage: true });
			mockSupplementRepo.findById.mockResolvedValue({ ...supplement, currentStock: "0" });

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockScheduleRepo.deactivateFinishPackageBySupplementId).toHaveBeenCalledWith("supp-1");
		});

		it("deactivates when stock goes negative (db GREATEST clamps to 0)", async () => {
			mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, finishPackage: true });
			mockSupplementRepo.findById.mockResolvedValue({ ...supplement, currentStock: "-0.5" });

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockScheduleRepo.deactivateFinishPackageBySupplementId).toHaveBeenCalledWith("supp-1");
		});

		it("does not deactivate when stock still positive", async () => {
			mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, finishPackage: true });
			mockSupplementRepo.findById.mockResolvedValue({ ...supplement, currentStock: "28" });

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockScheduleRepo.deactivateFinishPackageBySupplementId).not.toHaveBeenCalled();
		});

		it("does not check findById when finishPackage is false", async () => {
			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockSupplementRepo.findById).not.toHaveBeenCalled();
		});

		it("does not deactivate when supplement not found after decrement", async () => {
			mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, finishPackage: true });
			mockSupplementRepo.findById.mockResolvedValue(undefined);

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockScheduleRepo.deactivateFinishPackageBySupplementId).not.toHaveBeenCalled();
		});

		it("does not deactivate when updated supplement has null stock", async () => {
			mockScheduleRepo.findOwned.mockResolvedValue({ ...schedule, finishPackage: true });
			mockSupplementRepo.findById.mockResolvedValue({ ...supplement, currentStock: null });

			await markTaken({ scheduleId: "sched-1", date: "2025-03-01" });

			expect(mockScheduleRepo.deactivateFinishPackageBySupplementId).not.toHaveBeenCalled();
		});
	});
});
