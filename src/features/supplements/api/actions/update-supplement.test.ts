import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSupplementRepo, mockScheduleRepo } = vi.hoisted(() => ({
	mockSupplementRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
	mockScheduleRepo: {
		updateDosageUnitBySupplementId: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/repositories/supplement-repository", () => ({ supplementRepository: mockSupplementRepo }));
vi.mock("@/shared/repositories/supplement-schedule-repository", () => ({ supplementScheduleRepository: mockScheduleRepo }));

import { updateSupplement } from "./update-supplement";

const input = {
	supplementId: "supp-1",
	name: "Vitamin D",
	category: "vitamin" as const,
	stockUnit: "capsule" as const,
};

beforeEach(() => {
	vi.clearAllMocks();
	mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-1", stockUnit: "capsule" });
	mockSupplementRepo.update.mockResolvedValue({});
});

describe("updateSupplement", () => {
	it("verifies ownership before updating", async () => {
		await updateSupplement(input);

		expect(mockSupplementRepo.findByIdAndUserId).toHaveBeenCalledWith("supp-1", "user-1");
	});

	it("updates supplement fields", async () => {
		await updateSupplement(input);

		expect(mockSupplementRepo.update).toHaveBeenCalledWith("supp-1", expect.objectContaining({
			name: "Vitamin D",
			category: "vitamin",
			stockUnit: "capsule",
		}));
	});

	it("maps optional fields to null when absent", async () => {
		await updateSupplement(input);

		expect(mockSupplementRepo.update).toHaveBeenCalledWith("supp-1", expect.objectContaining({
			brandName: null,
			shopId: null,
			currentStock: null,
			packageSize: null,
			packagePrice: null,
		}));
	});

	it("maps provided optional fields correctly", async () => {
		await updateSupplement({
			...input,
			brandName: "Now Foods",
			currentStock: 30,
			packageSize: 60,
			packagePrice: 49.99,
		});

		expect(mockSupplementRepo.update).toHaveBeenCalledWith("supp-1", expect.objectContaining({
			brandName: "Now Foods",
			currentStock: "30",
			packageSize: 60,
			packagePrice: "49.99",
		}));
	});

	it("cascades stockUnit change to schedule dosageUnits", async () => {
		await updateSupplement({ ...input, stockUnit: "tablet" });

		expect(mockScheduleRepo.updateDosageUnitBySupplementId).toHaveBeenCalledWith("supp-1", "tablet");
	});

	it("does not cascade when stockUnit is unchanged", async () => {
		await updateSupplement(input);

		expect(mockScheduleRepo.updateDosageUnitBySupplementId).not.toHaveBeenCalled();
	});

	it("compares against existing stockUnit from DB, not from input", async () => {
		mockSupplementRepo.findByIdAndUserId.mockResolvedValue({ id: "supp-1", stockUnit: "ml" });

		await updateSupplement({ ...input, stockUnit: "capsule" });

		expect(mockScheduleRepo.updateDosageUnitBySupplementId).toHaveBeenCalledWith("supp-1", "capsule");
	});
});
