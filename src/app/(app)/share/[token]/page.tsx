import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImportProtocolPage } from "@/features/protocol-wizard/import-protocol-page";
import { auth } from "@/shared/lib/auth";

type Props = { params: Promise<{ token: string }> };

export default async function ShareRoute({ params }: Props) {
	const { token } = await params;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect(`/login?callbackUrl=/share/${token}`);

	return <ImportProtocolPage userId={session.user.id} token={token} />;
}
