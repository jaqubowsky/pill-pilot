import { describe, expect, it } from "vitest";
import { assignProtocolColors, PROTOCOL_BORDER_COLORS } from "./protocol-colors";

describe("assignProtocolColors", () => {
	it("returns empty for empty input", () => {
		expect(assignProtocolColors([])).toEqual({});
	});

	it("assigns an index within palette range", () => {
		const result = assignProtocolColors(["abc"]);
		expect(result.abc).toBeGreaterThanOrEqual(0);
		expect(result.abc).toBeLessThan(PROTOCOL_BORDER_COLORS.length);
	});

	it("is deterministic (same input = same output)", () => {
		const a = assignProtocolColors(["proto-1", "proto-2"]);
		const b = assignProtocolColors(["proto-1", "proto-2"]);
		expect(a).toEqual(b);
	});

	it("deduplicates protocol IDs", () => {
		const result = assignProtocolColors(["x", "x", "x"]);
		expect(Object.keys(result)).toHaveLength(1);
	});

	it("handles many IDs without out-of-range indices", () => {
		const ids = Array.from({ length: 50 }, (_, i) => `proto-${i}`);
		const result = assignProtocolColors(ids);

		for (const idx of Object.values(result)) {
			expect(idx).toBeGreaterThanOrEqual(0);
			expect(idx).toBeLessThan(PROTOCOL_BORDER_COLORS.length);
		}
	});

	it("handles UUID-style IDs", () => {
		const result = assignProtocolColors(["550e8400-e29b-41d4-a716-446655440000"]);
		const idx = Object.values(result)[0];
		expect(idx).toBeGreaterThanOrEqual(0);
		expect(idx).toBeLessThan(PROTOCOL_BORDER_COLORS.length);
	});

	it("different IDs can get different colors", () => {
		const ids = Array.from({ length: 20 }, (_, i) => `id-${i}`);
		const result = assignProtocolColors(ids);
		const uniqueIndices = new Set(Object.values(result));
		expect(uniqueIndices.size).toBeGreaterThan(1);
	});
});
