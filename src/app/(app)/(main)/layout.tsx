import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/shared/lib/auth";
import { PostAuthRedirect } from "@/shared/components/post-auth-redirect";
import { BottomNav } from "./bottom-nav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	return (
		<>
			<PostAuthRedirect />
			<div className="pb-16">
				<ViewTransition name="main-content">{children}</ViewTransition>
			</div>
			<BottomNav />
		</>
	);
}
