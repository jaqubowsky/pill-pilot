export function formatRemainingTime(ms: number): string {
	if (ms <= 0) return "0 min";

	const totalMinutes = Math.ceil(ms / 60_000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours > 0 && minutes > 0) return `${hours}h ${minutes} min`;
	if (hours > 0) return `${hours}h`;
	return `${minutes} min`;
}
