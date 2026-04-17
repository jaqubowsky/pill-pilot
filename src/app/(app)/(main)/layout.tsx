import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/shared/lib/auth";
import { consumePendingRedirect } from "@/shared/lib/pending-redirect";
import { BottomNav } from "./bottom-nav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const pendingRedirect = consumePendingRedirect(await cookies());
	if (pendingRedirect) redirect(pendingRedirect);

	return (
		<>
			<div className="pb-16">
				<ViewTransition name="main-content">{children}</ViewTransition>
			</div>
			<BottomNav />
		</>
	);
}
