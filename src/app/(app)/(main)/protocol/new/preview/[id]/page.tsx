import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProtocolPreviewPage } from "@/features/protocol-wizard";
import { auth } from "@/shared/lib/auth";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProtocolNewPreviewByIdRoute({ params }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect("/login");

	const { id } = await params;

	return <ProtocolPreviewPage userId={session.user.id} protocolId={id} />;
}
