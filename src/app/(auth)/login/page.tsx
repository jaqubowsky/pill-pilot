import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginPage } from "@/features/auth";
import { auth } from "@/shared/lib/auth";

export default async function LoginRoute() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session) {
		redirect("/dashboard");
	}

	return <LoginPage />;
}
