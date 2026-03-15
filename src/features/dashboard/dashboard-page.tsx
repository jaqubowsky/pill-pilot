import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { getDailyStatus } from "./api/queries/get-daily-status";
import { DailyView } from "./components/daily-view";

function getTodayString(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function getActiveBlockIndex(timeBlocks: { startTime: string }[]): number {
	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	let activeIndex = 0;
	for (let i = 0; i < timeBlocks.length; i++) {
		const [h, m] = timeBlocks[i].startTime.split(":").map(Number);
		if (h * 60 + m <= currentMinutes) {
			activeIndex = i;
		}
	}
	return activeIndex;
}

type Props = {
	userId: string;
	date?: string;
};

export async function DashboardPage({ userId, date }: Props) {
	const dateString = date ?? getTodayString();
	const [status, hasProcessing, hasDraft] = await Promise.all([
		getDailyStatus(userId, dateString),
		protocolRepository.hasProcessingByUserId(userId),
		protocolRepository.hasDraftByUserId(userId),
	]);

	return (
		<DailyView
			status={status}
			date={dateString}
			activeBlockIndex={getActiveBlockIndex(status.timeBlocks)}
			hasProcessing={hasProcessing}
			hasDraft={hasDraft}
		/>
	);
}
