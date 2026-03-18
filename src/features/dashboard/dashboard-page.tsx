import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { getDailyStatus } from "./api/queries/get-daily-status";
import { DailyView } from "./components/daily-view";

function getActiveBlockIndex(timeBlocks: { startTime: string }[]) {
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
	date: string;
};

export async function DashboardPage({ userId, date }: Props) {
	const [status, hasProcessing, hasDraft] = await Promise.all([
		getDailyStatus(userId, date),
		protocolRepository.hasProcessingByUserId(userId),
		protocolRepository.hasDraftByUserId(userId),
	]);

	return (
		<DailyView
			status={status}
			activeBlockIndex={getActiveBlockIndex(status.timeBlocks)}
			hasProcessing={hasProcessing}
			hasDraft={hasDraft}
		/>
	);
}
