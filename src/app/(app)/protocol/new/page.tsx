import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProtocolUploadPage } from "@/features/onboarding";
import { auth } from "@/shared/lib/auth";

export default async function ProtocolNewRoute() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect("/login");

	return <ProtocolUploadPage userId={session.user.id} />;
}
