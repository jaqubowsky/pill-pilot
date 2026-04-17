import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { LoginPage } from "@/features/auth";
import { auth } from "@/shared/lib/auth";

type Props = { searchParams: Promise<SearchParams> };

export default async function LoginRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session) {
		redirect("/dashboard");
	}

	const params = await searchParams;
	const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

	return <LoginPage callbackUrl={callbackUrl} />;
}
