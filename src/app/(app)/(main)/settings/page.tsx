import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsPageWrapper } from "@/features/settings";
import { auth } from "@/shared/lib/auth";

export default async function SettingsRoute() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	return <SettingsPageWrapper userId={session.user.id} userEmail={session.user.email} />;
}
