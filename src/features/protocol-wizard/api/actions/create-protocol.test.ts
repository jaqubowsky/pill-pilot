import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo, mockScheduleRepo, mockTimeBlockRepo, mockResolveSupplements, mockBuildScheduleDataList } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
	mockScheduleRepo: {
		create: vi.fn(),
	},
	mockTimeBlockRepo: {
		findByUserId: vi.fn(),
	},
	mockResolveSupplements: vi.fn(),
	mockBuildScheduleDataList: vi.fn(),
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({
	createSafeActionClient: vi.fn(),
	returnValidationErrors: (_schema: any, errors: any) => {
		throw new Error(`ValidationErrors: ${JSON.stringify(errors)}`);
	},
}));
vi.mock("@/shared/repositories/protocol-repository", () => ({ protocolRepository: mockProtocolRepo }));
vi.mock("@/shared/repositories/supplement-schedule-repository", () => ({ supplementScheduleRepository: mockScheduleRepo }));
vi.mock("@/shared/repositories/time-block-repository", () => ({ timeBlockRepository: mockTimeBlockRepo }));
vi.mock("@/features/protocol-wizard/lib/resolve-supplements", () => ({
	resolveSupplements: mockResolveSupplements,
	buildScheduleDataList: mockBuildScheduleDataList,
}));

import { createProtocol } from "./create-protocol";

const validParsedData = {
	protocolName: "Test Protocol",
	supplements: [
		{
			name: "Vitamin D",
			category: "vitamin",
			confidence: 0.95,
			isCritical: false,
			brandName: null,
			existingSupplementId: null,
			schedules: [
				{
					timeBlockId: "tb-1",
					dosageAmount: 1,
					dosageUnit: "capsule",
				},
			],
		},
	],
};

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1" });
	mockProtocolRepo.update.mockResolvedValue({});
	mockTimeBlockRepo.findByUserId.mockResolvedValue([{ id: "tb-1" }]);
	mockResolveSupplements.mockResolvedValue([{ supplementId: "supp-1", isNew: true }]);
	mockBuildScheduleDataList.mockReturnValue([
		{ protocolId: "proto-1", supplementId: "supp-1", timeBlockId: "tb-1" },
	]);
	mockScheduleRepo.create.mockResolvedValue({});
});

describe("createProtocol", () => {
	it("rejects when unverified supplements exist", async () => {
		const data = {
			...validParsedData,
			supplements: [{ ...validParsedData.supplements[0], confidence: 0.3, isCritical: false }],
		};

		await expect(
			createProtocol({
				protocolId: "proto-1",
				parsedData: JSON.stringify(data),
				startDate: "2025-03-01",
			}),
		).rejects.toThrow("ValidationErrors");
	});

	it("creates schedules and activates protocol", async () => {
		await createProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(validParsedData),
			startDate: "2025-03-01",
		});

		expect(mockScheduleRepo.create).toHaveBeenCalledTimes(1);
		expect(mockProtocolRepo.update).toHaveBeenCalledWith(
			"proto-1",
			expect.objectContaining({ status: "active", startDate: "2025-03-01" }),
		);
	});

	it("returns newSupplementIds for newly created supplements", async () => {
		const result = await createProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(validParsedData),
			startDate: "2025-03-01",
		});

		expect(result).toEqual({ newSupplementIds: ["supp-1"] });
	});

	it("excludes existing supplements from newSupplementIds", async () => {
		mockResolveSupplements.mockResolvedValue([{ supplementId: "supp-1", isNew: false }]);

		const result = await createProtocol({
			protocolId: "proto-1",
			parsedData: JSON.stringify(validParsedData),
			startDate: "2025-03-01",
		});

		expect(result).toEqual({ newSupplementIds: [] });
	});
});
