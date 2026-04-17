import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { importSharedProtocolDraft } from "@/features/protocol-wizard/api/services/import-protocol-service";
import { auth } from "@/shared/lib/auth";

type Props = { params: Promise<{ token: string }> };

export default async function ShareRoute({ params }: Props) {
	const { token } = await params;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		const cookieStore = await cookies();
		cookieStore.set("post_auth_redirect", `/share/${token}`, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			maxAge: 60 * 15,
			path: "/",
		});
		redirect("/login");
	}

	const protocolId = await importSharedProtocolDraft({ token, userId: session.user.id });
	if (!protocolId) notFound();

	redirect(`/protocol/new/preview/${protocolId}`);
}
