import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";

const publicPaths = ["/login", "/api/auth", "/api/push/send", "/api/push/timers"];

const PENDING_REDIRECT_COOKIE = "post_auth_redirect";
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: "lax" as const,
	maxAge: 60 * 15,
	path: "/",
};

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isPublicPath = publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

	if (isPublicPath) return NextResponse.next();

	const session = await auth.api.getSession({ headers: request.headers });

	if (pathname.startsWith("/share/")) {
		if (!session) {
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.set(PENDING_REDIRECT_COOKIE, pathname, COOKIE_OPTIONS);
			return response;
		}
		return NextResponse.next();
	}

	if (!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const pendingRedirect = request.cookies.get(PENDING_REDIRECT_COOKIE)?.value;
	if (pendingRedirect) {
		const response = NextResponse.redirect(new URL(pendingRedirect, request.url));
		response.cookies.delete(PENDING_REDIRECT_COOKIE);
		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
