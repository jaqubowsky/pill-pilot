import { getWeeklyStatus } from "./api/queries/get-weekly-status";
import { WeeklyView } from "./components/weekly-view";

function getMondayOfCurrentWeek(): string {
	const now = new Date();
	const day = now.getDay();
	const diff = now.getDate() - day + (day === 0 ? -6 : 1);
	const monday = new Date(now);
	monday.setDate(diff);
	const y = monday.getFullYear();
	const m = String(monday.getMonth() + 1).padStart(2, "0");
	const d = String(monday.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

type Props = {
	userId: string;
	startDate?: string;
};

export async function WeeklyDashboardPage({ userId, startDate }: Props) {
	const start = startDate ?? getMondayOfCurrentWeek();
	const status = await getWeeklyStatus(userId, start);

	return <WeeklyView status={status} startDate={start} />;
}
