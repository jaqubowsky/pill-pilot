import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({ createSafeActionClient: vi.fn() }));
vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));

import { revokeShareToken } from "./revoke-share-token";

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", shareToken: "tok" });
	mockProtocolRepo.update.mockResolvedValue({});
});

describe("revokeShareToken", () => {
	it("sets shareToken to null", async () => {
		await revokeShareToken({ protocolId: "proto-1" });

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", { shareToken: null });
	});

	it("throws when protocol not owned by user", async () => {
		mockProtocolRepo.findByIdAndUserId.mockRejectedValue(new Error("PROTOCOL_NOT_FOUND"));

		await expect(revokeShareToken({ protocolId: "other" })).rejects.toThrow();
	});

	it("is a no-op when shareToken already null (no error thrown)", async () => {
		mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", shareToken: null });

		await expect(revokeShareToken({ protocolId: "proto-1" })).resolves.not.toThrow();
		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", { shareToken: null });
	});
});
