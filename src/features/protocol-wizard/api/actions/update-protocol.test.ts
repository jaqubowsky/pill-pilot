import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo, mockScheduleRepo, mockTimeBlockRepo, mockResolveSupplements, mockBuildScheduleDataList } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
	mockScheduleRepo: {
		findByProtocolId: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteById: vi.fn(),
	},
	mockTimeBlockRepo: {
		findByUserId: vi.fn(),
	},
	mockResolveSupplements: vi.fn(),
	mockBuildScheduleDataList: vi.fn(),
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/repositories/protocol-repository", () => ({ protocolRepository: mockProtocolRepo }));
vi.mock("@/shared/repositories/supplement-schedule-repository", () => ({ supplementScheduleRepository: mockScheduleRepo }));
vi.mock("@/shared/repositories/time-block-repository", () => ({ timeBlockRepository: mockTimeBlockRepo }));
vi.mock("@/features/protocol-wizard/lib/resolve-supplements", () => ({
	resolveSupplements: mockResolveSupplements,
	buildScheduleDataList: mockBuildScheduleDataList,
}));

import { updateProtocol } from "./update-protocol";

const parsedData = {
	protocolName: "Updated Protocol",
	supplements: [
		{
			name: "Vitamin D",
			category: "vitamin",
			confidence: 0.95,
			isCritical: false,
			brandName: null,
			existingSupplementId: "supp-1",
			schedules: [
				{ timeBlockId: "tb-1", dosageAmount: 1, dosageUnit: "capsule" },
			],
		},
	],
};

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1" });
	mockProtocolRepo.update.mockResolvedValue({});
	mockTimeBlockRepo.findByUserId.mockResolvedValue([{ id: "tb-1" }, { id: "tb-2" }]);
	mockResolveSupplements.mockResolvedValue([{ supplementId: "supp-1", isNew: false }]);
	mockScheduleRepo.create.mockResolvedValue({});
	mockScheduleRepo.update.mockResolvedValue({});
});

describe("updateProtocol", () => {
	it("verifies protocol ownership", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([]);
		mockBuildScheduleDataList.mockReturnValue([]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-03-01",
		});

		expect(mockProtocolRepo.findByIdAndUserId).toHaveBeenCalledWith("proto-1", "user-1");
	});

	it("updates existing schedules matched by supplementId:timeBlockId key", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([
			{ id: "existing-1", supplementId: "supp-1", timeBlockId: "tb-1" },
		]);
		mockBuildScheduleDataList.mockReturnValue([
			{ supplementId: "supp-1", timeBlockId: "tb-1", dosageAmount: "2" },
		]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-03-01",
		});

		expect(mockScheduleRepo.update).toHaveBeenCalledWith("existing-1", expect.objectContaining({
			supplementId: "supp-1",
			timeBlockId: "tb-1",
		}));
		expect(mockScheduleRepo.create).not.toHaveBeenCalled();
		expect(mockScheduleRepo.deleteById).not.toHaveBeenCalled();
	});

	it("creates new schedules not in existing", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([]);
		mockBuildScheduleDataList.mockReturnValue([
			{ supplementId: "supp-1", timeBlockId: "tb-1", dosageAmount: "1" },
		]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-03-01",
		});

		expect(mockScheduleRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ supplementId: "supp-1", timeBlockId: "tb-1" }),
		);
	});

	it("deletes schedules no longer in parsed data", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([
			{ id: "existing-1", supplementId: "supp-1", timeBlockId: "tb-1" },
			{ id: "existing-2", supplementId: "supp-old", timeBlockId: "tb-2" },
		]);
		mockBuildScheduleDataList.mockReturnValue([
			{ supplementId: "supp-1", timeBlockId: "tb-1" },
		]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-03-01",
		});

		expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
		expect(mockScheduleRepo.deleteById).toHaveBeenCalledWith("existing-2");
		expect(mockScheduleRepo.deleteById).toHaveBeenCalledTimes(1);
	});

	it("deletes all existing schedules when new data is empty", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([
			{ id: "existing-1", supplementId: "supp-1", timeBlockId: "tb-1" },
			{ id: "existing-2", supplementId: "supp-2", timeBlockId: "tb-2" },
		]);
		mockBuildScheduleDataList.mockReturnValue([]);

		const emptyData = { ...parsedData, supplements: [] };
		mockResolveSupplements.mockResolvedValue([]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(emptyData),
			startDate: "2025-03-01",
		});

		expect(mockScheduleRepo.deleteById).toHaveBeenCalledWith("existing-1");
		expect(mockScheduleRepo.deleteById).toHaveBeenCalledWith("existing-2");
		expect(mockScheduleRepo.update).not.toHaveBeenCalled();
		expect(mockScheduleRepo.create).not.toHaveBeenCalled();
	});

	it("handles mixed create/update/delete in one call", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([
			{ id: "keep", supplementId: "supp-1", timeBlockId: "tb-1" },
			{ id: "remove", supplementId: "supp-2", timeBlockId: "tb-2" },
		]);
		mockBuildScheduleDataList.mockReturnValue([
			{ supplementId: "supp-1", timeBlockId: "tb-1" },
			{ supplementId: "supp-3", timeBlockId: "tb-1" },
		]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-03-01",
		});

		expect(mockScheduleRepo.update).toHaveBeenCalledWith("keep", expect.any(Object));
		expect(mockScheduleRepo.create).toHaveBeenCalledWith(expect.objectContaining({ supplementId: "supp-3" }));
		expect(mockScheduleRepo.deleteById).toHaveBeenCalledWith("remove");
	});

	it("updates protocol metadata with name from parsed data", async () => {
		mockScheduleRepo.findByProtocolId.mockResolvedValue([]);
		mockBuildScheduleDataList.mockReturnValue([]);

		await updateProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-04-01",
		});

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", {
			name: "Updated Protocol",
			parsedData: JSON.stringify(parsedData),
			startDate: "2025-04-01",
		});
	});
});
