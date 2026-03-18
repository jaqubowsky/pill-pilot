import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { MonthlyDashboardPage } from "@/features/dashboard";
import { loadMonthlySearchParams } from "@/features/dashboard/search-params";
import { auth } from "@/shared/lib/auth";

type Props = {
	searchParams: Promise<SearchParams>;
};

export default async function MonthlyDashboardRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { month } = await loadMonthlySearchParams(searchParams);

	return <MonthlyDashboardPage userId={session.user.id} yearMonth={month} />;
}
