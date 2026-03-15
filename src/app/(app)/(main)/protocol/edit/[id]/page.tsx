import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProtocolEditPage } from "@/features/protocol-wizard";
import { auth } from "@/shared/lib/auth";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProtocolEditRoute({ params }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect("/login");

	const { id } = await params;

	return <ProtocolEditPage userId={session.user.id} protocolId={id} />;
}
