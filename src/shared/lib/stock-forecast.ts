const MS_PER_DAY = 86_400_000;
const MAX_FORECAST_DAYS = 730;

export const DELIVERY_BUFFER_DAYS = 3;

type ScheduleConsumption = {
	dosageAmount: number;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	protocolStartDate: string | null;
};

function isConsumedOnDay(
	schedule: ScheduleConsumption,
	protocolStartMs: number,
	targetMs: number,
): boolean {
	const scheduleStartMs = protocolStartMs + schedule.startDayOffset * MS_PER_DAY;

	if (targetMs < scheduleStartMs) return false;

	if (schedule.durationDays !== null) {
		const scheduleEndMs = scheduleStartMs + schedule.durationDays * MS_PER_DAY;
		if (targetMs >= scheduleEndMs) return false;
	}

	if (schedule.cycleDaysOn !== null && schedule.cycleDaysOff !== null) {
		const cyclePeriod = schedule.cycleDaysOn + schedule.cycleDaysOff;
		if (cyclePeriod === 0) return false;
		const daysSinceScheduleStart = Math.floor((targetMs - scheduleStartMs) / MS_PER_DAY);
		const dayInCycle = daysSinceScheduleStart % cyclePeriod;
		if (dayInCycle >= schedule.cycleDaysOn) return false;
	}

	return true;
}

export function forecastDaysInStock(
	currentStock: number,
	schedules: ScheduleConsumption[],
	today: string,
): number {
	if (currentStock <= 0) return 0;
	if (schedules.length === 0) return Number.POSITIVE_INFINITY;

	const todayMs = new Date(today).getTime();
	let stock = currentStock;
	let lastConsumptionDay = -1;

	for (let day = 0; day < MAX_FORECAST_DAYS; day++) {
		const targetMs = todayMs + day * MS_PER_DAY;
		let dailyConsumption = 0;

		for (const schedule of schedules) {
			if (schedule.protocolStartDate === null) {
				dailyConsumption += schedule.dosageAmount;
				continue;
			}

			const protocolStartMs = new Date(schedule.protocolStartDate).getTime();

			if (isConsumedOnDay(schedule, protocolStartMs, targetMs)) {
				dailyConsumption += schedule.dosageAmount;
			}
		}

		if (dailyConsumption > 0) {
			stock -= dailyConsumption;
			lastConsumptionDay = day;
			if (stock <= 0) return day + 1;
		}
	}

	if (lastConsumptionDay === -1) return Number.POSITIVE_INFINITY;

	return MAX_FORECAST_DAYS;
}

export function calculateConsumedUnits(
	schedules: ScheduleConsumption[],
	daysAgo: number,
	today: string,
): number {
	if (schedules.length === 0 || daysAgo <= 0) return 0;

	const todayMs = new Date(today).getTime();
	const startMs = todayMs - daysAgo * MS_PER_DAY;
	let consumed = 0;

	for (let day = 0; day < daysAgo; day++) {
		const targetMs = startMs + day * MS_PER_DAY;

		for (const schedule of schedules) {
			if (schedule.protocolStartDate === null) {
				consumed += schedule.dosageAmount;
				continue;
			}

			const protocolStartMs = new Date(schedule.protocolStartDate).getTime();

			if (isConsumedOnDay(schedule, protocolStartMs, targetMs)) {
				consumed += schedule.dosageAmount;
			}
		}
	}

	return consumed;
}
