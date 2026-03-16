import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShoppingPage } from "@/features/shopping";
import { auth } from "@/shared/lib/auth";

export default async function ShoppingRoute() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	return <ShoppingPage userId={session.user.id} />;
}
