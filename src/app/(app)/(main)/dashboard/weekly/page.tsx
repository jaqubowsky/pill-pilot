import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { WeeklyDashboardPage } from "@/features/dashboard";
import { loadWeeklySearchParams } from "@/features/dashboard/search-params";
import { auth } from "@/shared/lib/auth";

type Props = {
	searchParams: Promise<SearchParams>;
};

export default async function WeeklyDashboardRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { start } = await loadWeeklySearchParams(searchParams);

	return <WeeklyDashboardPage userId={session.user.id} startDate={start} />;
}
