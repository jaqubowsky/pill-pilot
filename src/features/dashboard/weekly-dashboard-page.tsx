import { getWeeklyStatus } from "./api/queries/get-weekly-status";
import { WeeklyView } from "./components/weekly-view";

type Props = {
	userId: string;
	startDate: string;
};

export async function WeeklyDashboardPage({ userId, startDate }: Props) {
	const status = await getWeeklyStatus(userId, startDate);

	return <WeeklyView status={status} />;
}
