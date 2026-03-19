export function splitMinutes(totalMinutes: number): { hours: number; mins: number } {
	return {
		hours: Math.floor(totalMinutes / 60),
		mins: totalMinutes % 60,
	};
}

export function combineToMinutes(hours: number, mins: number, { min = 0 } = {}): number {
	const h = Math.max(0, Math.min(23, hours));
	const m = Math.max(0, Math.min(59, mins));
	return Math.max(min, h * 60 + m);
}

export function formatMinutes(minutes: number): string {
	const { hours, mins } = splitMinutes(minutes);

	if (hours > 0 && mins > 0) return `${hours}h ${mins} min`;
	if (hours > 0) return `${hours}h`;
	return `${mins} min`;
}
