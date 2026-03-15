import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProtocolManualPage } from "@/features/protocol-wizard";
import { auth } from "@/shared/lib/auth";

export default async function ProtocolNewManualRoute() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect("/login");

	return <ProtocolManualPage userId={session.user.id} />;
}
