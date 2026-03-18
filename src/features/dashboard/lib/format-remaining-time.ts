export function formatRemainingTime(ms: number): string {
	if (ms <= 0) return "0 min";

	const totalSeconds = Math.ceil(ms / 1_000);
	const hours = Math.floor(totalSeconds / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0 && minutes > 0) return `${hours}h ${minutes} min`;
	if (hours > 0) return `${hours}h`;

	if (minutes > 0 && seconds > 0) return `${minutes}:${String(seconds).padStart(2, "0")}`;
	if (minutes > 0) return `${minutes} min`;

	return `${seconds}s`;
}
