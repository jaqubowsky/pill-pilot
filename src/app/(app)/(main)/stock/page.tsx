import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StockPage } from "@/features/stock";
import { auth } from "@/shared/lib/auth";

export default async function StockRoute() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	return <StockPage userId={session.user.id} />;
}
