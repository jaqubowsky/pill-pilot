import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateText } = vi.hoisted(() => ({
	mockGenerateText: vi.fn(),
}));

vi.mock("ai", () => ({
	generateText: mockGenerateText,
	Output: { object: vi.fn((x) => x) },
}));
vi.mock("@/shared/lib/ai", () => ({
	anthropic: vi.fn(() => "mock-model"),
}));

import { matchShareSupplements } from "./build-share-ai-content";

const existingSupplements = [
	{ id: "s1", name: "Vitamin D", brandName: null, packageSize: null },
	{ id: "s2", name: "Magnesium", brandName: "Now Foods", packageSize: 100 },
];

beforeEach(() => {
	vi.clearAllMocks();
	mockGenerateText.mockResolvedValue({
		output: { matches: [{ index: 0, existingSupplementId: "s1" }] },
	});
});

describe("matchShareSupplements", () => {
	it("returns null array when no existing supplements", async () => {
		const result = await matchShareSupplements(["Vitamin D"], []);

		expect(mockGenerateText).not.toHaveBeenCalled();
		expect(result).toEqual([null]);
	});

	it("returns empty array when no shared supplements", async () => {
		const result = await matchShareSupplements([], existingSupplements);

		expect(mockGenerateText).not.toHaveBeenCalled();
		expect(result).toEqual([]);
	});

	it("calls AI and returns mapped supplement IDs", async () => {
		mockGenerateText.mockResolvedValue({
			output: {
				matches: [
					{ index: 0, existingSupplementId: "s1" },
					{ index: 1, existingSupplementId: null },
				],
			},
		});

		const result = await matchShareSupplements(["Vitamin D", "Unknown Herb"], existingSupplements);

		expect(mockGenerateText).toHaveBeenCalledTimes(1);
		expect(result).toEqual(["s1", null]);
	});

	it("falls back to null for indexes not returned by AI", async () => {
		mockGenerateText.mockResolvedValue({
			output: { matches: [] },
		});

		const result = await matchShareSupplements(["Vitamin D"], existingSupplements);

		expect(result).toEqual([null]);
	});
});
