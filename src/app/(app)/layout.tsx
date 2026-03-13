import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	return (
		<div className="relative min-h-screen bg-surface">
			<main className="mx-auto max-w-md">{children}</main>
		</div>
	);
}
