import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { DashboardPage } from "@/features/dashboard";
import { loadDashboardSearchParams } from "@/features/dashboard/search-params";
import { auth } from "@/shared/lib/auth";

type Props = {
	searchParams: Promise<SearchParams>;
};

export default async function DashboardRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { date } = await loadDashboardSearchParams(searchParams);

	return <DashboardPage userId={session.user.id} date={date} />;
}
