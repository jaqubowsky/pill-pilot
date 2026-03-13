import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProtocolPreviewPage } from "@/features/onboarding";
import { auth } from "@/shared/lib/auth";

export default async function ProtocolNewPreviewRoute() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect("/login");

	return <ProtocolPreviewPage userId={session.user.id} />;
}
