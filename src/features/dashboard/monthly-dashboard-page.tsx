import { getMonthlyStatus } from "./api/queries/get-monthly-status";
import { MonthlyView } from "./components/monthly-view";

type Props = {
	userId: string;
	yearMonth: string;
};

export async function MonthlyDashboardPage({ userId, yearMonth }: Props) {
	const status = await getMonthlyStatus(userId, yearMonth);

	return <MonthlyView status={status} />;
}
