import { describe, expect, it, vi } from "vitest";
import { consumePendingRedirect, setPendingRedirect } from "./pending-redirect";

function makeCookieStore(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	return {
		get: vi.fn((name: string) => {
			const value = store.get(name);
			return value !== undefined ? { value } : undefined;
		}),
		set: vi.fn((name: string, value: string) => {
			store.set(name, value);
		}),
		delete: vi.fn((name: string) => {
			store.delete(name);
		}),
	};
}

describe("setPendingRedirect", () => {
	it("sets the cookie with the given URL", () => {
		const cookies = makeCookieStore();
		setPendingRedirect(cookies, "/share/abc123");
		expect(cookies.set).toHaveBeenCalledWith(
			"post_auth_redirect",
			"/share/abc123",
			expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
		);
	});
});

describe("consumePendingRedirect", () => {
	it("returns the stored URL", () => {
		const cookies = makeCookieStore({ post_auth_redirect: "/share/abc123" });
		const result = consumePendingRedirect(cookies);
		expect(result).toBe("/share/abc123");
	});

	it("deletes the cookie after reading", () => {
		const cookies = makeCookieStore({ post_auth_redirect: "/share/abc123" });
		consumePendingRedirect(cookies);
		expect(cookies.delete).toHaveBeenCalledWith("post_auth_redirect");
	});

	it("returns null when cookie is not set", () => {
		const cookies = makeCookieStore();
		const result = consumePendingRedirect(cookies);
		expect(result).toBeNull();
	});

	it("does not call delete when cookie is absent", () => {
		const cookies = makeCookieStore();
		consumePendingRedirect(cookies);
		expect(cookies.delete).not.toHaveBeenCalled();
	});
});
