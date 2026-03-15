import { ViewTransition } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
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
			<div className="pb-16">
				<ViewTransition name="main-content">{children}</ViewTransition>
			</div>
			<BottomNav />
		</>
	);
}
