import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo, mockTimeBlockRepo } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByShareToken: vi.fn(),
		create: vi.fn(),
	},
	mockTimeBlockRepo: {
		create: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({ createSafeActionClient: vi.fn() }));
vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));
vi.mock("@/shared/repositories/time-block-repository", () => ({
	timeBlockRepository: mockTimeBlockRepo,
}));

import { importSharedProtocol } from "./import-shared-protocol";

const validParsedData = JSON.stringify({
	protocolName: "Shared Protocol",
	supplements: [
		{
			name: "Vitamin D",
			existingSupplementId: "s1",
			category: "vitamin",
			isCritical: false,
			confidence: 1,
			schedules: [{ timeBlockId: "tb-1", dosageAmount: 1, dosageUnit: "capsule" }],
		},
	],
});

const parsedDataWithTempBlock = JSON.stringify({
	protocolName: "Shared Protocol",
	supplements: [
		{
			name: "Magnesium",
			existingSupplementId: null,
			category: "mineral",
			isCritical: false,
			confidence: 1,
			schedules: [{ timeBlockId: "temp-abc", dosageAmount: 300, dosageUnit: "mg" }],
		},
	],
});

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByShareToken.mockResolvedValue({ id: "shared-proto" });
	mockProtocolRepo.create.mockResolvedValue({ id: "new-proto" });
	mockTimeBlockRepo.create.mockResolvedValue({ id: "real-tb-id" });
});

describe("importSharedProtocol", () => {
	it("throws when shareToken is invalid", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue(null);

		await expect(
			importSharedProtocol({
				shareToken: "bad-token",
				name: "My Protocol",
				parsedData: validParsedData,
				timeBlocksToCreate: [],
			}),
		).rejects.toThrow();
	});

	it("creates protocol with recipient userId", async () => {
		await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: validParsedData,
			timeBlocksToCreate: [],
		});

		expect(mockProtocolRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1", status: "draft" }),
		);
	});

	it("creates new time blocks from timeBlocksToCreate", async () => {
		await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: parsedDataWithTempBlock,
			timeBlocksToCreate: [
				{ tempId: "temp-abc", name: "Wieczór", icon: "🌙", startTime: "21:00" },
			],
		});

		expect(mockTimeBlockRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Wieczór", icon: "🌙", startTime: "21:00", userId: "user-1" }),
		);
	});

	it("replaces tempId with real time block id in parsedData stored in protocol", async () => {
		mockTimeBlockRepo.create.mockResolvedValue({ id: "real-tb-id" });

		await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: parsedDataWithTempBlock,
			timeBlocksToCreate: [
				{ tempId: "temp-abc", name: "Wieczór", icon: "🌙", startTime: "21:00" },
			],
		});

		const storedParsedData = mockProtocolRepo.create.mock.calls[0][0].parsedData as string;
		const parsed = JSON.parse(storedParsedData);
		expect(parsed.supplements[0].schedules[0].timeBlockId).toBe("real-tb-id");
	});

	it("returns protocolId of newly created protocol", async () => {
		const result = await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: validParsedData,
			timeBlocksToCreate: [],
		});

		expect(result).toEqual({ protocolId: "new-proto" });
	});
});
