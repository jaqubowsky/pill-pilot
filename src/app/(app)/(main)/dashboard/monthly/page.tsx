import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MonthlyDashboardPage } from "@/features/dashboard";
import { auth } from "@/shared/lib/auth";

type Props = {
	searchParams: Promise<{ month?: string }>;
};

export default async function MonthlyDashboardRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { month } = await searchParams;

	return <MonthlyDashboardPage userId={session.user.id} yearMonth={month} />;
}
