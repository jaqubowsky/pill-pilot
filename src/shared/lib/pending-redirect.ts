type CookieStore = {
	get(name: string): { value: string } | undefined;
	set(name: string, value: string, options?: object): void;
	delete(name: string): void;
};

const COOKIE_NAME = "post_auth_redirect";
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: "lax" as const,
	maxAge: 60 * 15,
	path: "/",
};

export function setPendingRedirect(cookieStore: CookieStore, url: string) {
	cookieStore.set(COOKIE_NAME, url, COOKIE_OPTIONS);
}

export function consumePendingRedirect(cookieStore: CookieStore): string | null {
	const value = cookieStore.get(COOKIE_NAME)?.value ?? null;
	if (value) cookieStore.delete(COOKIE_NAME);
	return value;
}
