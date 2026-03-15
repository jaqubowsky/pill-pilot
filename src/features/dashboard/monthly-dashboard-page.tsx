import { getMonthlyStatus } from "./api/queries/get-monthly-status";
import { MonthlyView } from "./components/monthly-view";

function getCurrentYearMonth(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

type Props = {
	userId: string;
	yearMonth?: string;
};

export async function MonthlyDashboardPage({ userId, yearMonth }: Props) {
	const ym = yearMonth ?? getCurrentYearMonth();
	const status = await getMonthlyStatus(userId, ym);

	return <MonthlyView status={status} yearMonth={ym} />;
}
