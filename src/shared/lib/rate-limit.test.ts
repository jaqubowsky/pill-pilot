import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it("allows requests under the limit", () => {
		const isRateLimited = createRateLimiter({ maxRequests: 3 });

		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-1")).toBe(false);
	});

	it("blocks requests over the limit", () => {
		const isRateLimited = createRateLimiter({ maxRequests: 2 });

		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-1")).toBe(true);
	});

	it("tracks users independently", () => {
		const isRateLimited = createRateLimiter({ maxRequests: 1 });

		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-2")).toBe(false);
		expect(isRateLimited("user-1")).toBe(true);
		expect(isRateLimited("user-2")).toBe(true);
	});

	it("resets after the window expires", () => {
		const isRateLimited = createRateLimiter({ windowMs: 1000, maxRequests: 1 });

		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-1")).toBe(true);

		vi.advanceTimersByTime(1001);

		expect(isRateLimited("user-1")).toBe(false);
	});

	it("uses 60s window by default", () => {
		const isRateLimited = createRateLimiter({ maxRequests: 1 });

		expect(isRateLimited("user-1")).toBe(false);
		expect(isRateLimited("user-1")).toBe(true);

		vi.advanceTimersByTime(59_999);
		expect(isRateLimited("user-1")).toBe(true);

		vi.advanceTimersByTime(2);
		expect(isRateLimited("user-1")).toBe(false);
	});
});
