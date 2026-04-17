import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo, mockDb } = vi.hoisted(() => ({
	mockProtocolRepo: { findByShareToken: vi.fn() },
	mockDb: { select: vi.fn() },
}));

vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));
vi.mock("@/shared/db/client", () => ({ db: mockDb }));

const mockRows = [
	{
		supplementName: "Vitamin D",
		supplementCategory: "vitamin",
		supplementStockUnit: "capsule",
		timeBlockName: "Rano",
		timeBlockIcon: "☀️",
		timeBlockStartTime: "08:00",
		dosageAmount: "1.00",
		dosageUnit: "capsule",
		notes: null,
		isCritical: false,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: null,
		waitAfterTakingMinutes: null,
		sortOrder: 0,
		finishPackage: false,
	},
];

function buildDbChain(rows: typeof mockRows) {
	const chain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockResolvedValue(rows),
	};
	mockDb.select.mockReturnValue(chain);
	return chain;
}

beforeEach(() => {
	vi.clearAllMocks();
});

import { getSharedProtocol } from "./get-shared-protocol";

describe("getSharedProtocol", () => {
	it("returns null when token not found", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue(null);

		const result = await getSharedProtocol("bad-token");

		expect(result).toBeNull();
	});

	it("returns structured protocol data when token is valid", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue({ id: "proto-1", name: "My Protocol" });
		buildDbChain(mockRows);

		const result = await getSharedProtocol("valid-token");

		expect(result).not.toBeNull();
		expect(result?.protocolName).toBe("My Protocol");
		expect(result?.supplements).toHaveLength(1);
		expect(result?.supplements[0].name).toBe("Vitamin D");
		expect(result?.supplements[0].schedules[0].dosageAmount).toBe(1);
	});

	it("groups multiple schedules under the same supplement", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue({ id: "proto-1", name: "Protocol" });
		buildDbChain([
			{ ...mockRows[0] },
			{ ...mockRows[0], timeBlockName: "Wieczór", timeBlockStartTime: "20:00", sortOrder: 1 },
		]);

		const result = await getSharedProtocol("token");

		expect(result?.supplements).toHaveLength(1);
		expect(result?.supplements[0].schedules).toHaveLength(2);
	});
});
