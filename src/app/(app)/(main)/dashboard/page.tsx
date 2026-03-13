import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardPage } from "@/features/dashboard";
import { auth } from "@/shared/lib/auth";

type Props = {
	searchParams: Promise<{ date?: string }>;
};

export default async function DashboardRoute({ searchParams }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { date } = await searchParams;

	return <DashboardPage userId={session.user.id} date={date} />;
}
