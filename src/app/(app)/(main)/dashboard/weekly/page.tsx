import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WeeklyDashboardPage } from "@/features/dashboard";
import { auth } from "@/shared/lib/auth";

type Props = {
	searchParams: Promise<{ start?: string }>;
};

export default async function WeeklyDashboardRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { start } = await searchParams;

	return <WeeklyDashboardPage userId={session.user.id} startDate={start} />;
}
