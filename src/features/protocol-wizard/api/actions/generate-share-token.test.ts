import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({
	createSafeActionClient: vi.fn(),
}));
vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));
vi.mock("@paralleldrive/cuid2", () => ({
	createId: () => "test-token-abc123",
}));

import { generateShareToken } from "./generate-share-token";

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", status: "active" });
	mockProtocolRepo.update.mockResolvedValue({});
});

describe("generateShareToken", () => {
	it("saves token to protocol and returns it", async () => {
		const result = await generateShareToken({ protocolId: "proto-1" });

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", {
			shareToken: "test-token-abc123",
		});
		expect(result).toEqual({ shareToken: "test-token-abc123" });
	});

	it("throws when protocol not found or not owned by user", async () => {
		mockProtocolRepo.findByIdAndUserId.mockRejectedValue(new Error("PROTOCOL_NOT_FOUND"));

		await expect(generateShareToken({ protocolId: "other-proto" })).rejects.toThrow();
	});

	it("throws when protocol status is not active", async () => {
		mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", status: "draft" });

		await expect(generateShareToken({ protocolId: "proto-1" })).rejects.toThrow();
	});

	it("overwrites existing token when called again", async () => {
		mockProtocolRepo.findByIdAndUserId.mockResolvedValue({
			id: "proto-1",
			status: "active",
			shareToken: "old-token",
		});

		await generateShareToken({ protocolId: "proto-1" });

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", {
			shareToken: "test-token-abc123",
		});
	});
});
