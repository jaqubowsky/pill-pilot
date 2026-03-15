"use client";

export function useTimeDurationInput(value: number, onChange: (minutes: number) => void) {
	const hours = Math.floor(value / 60);
	const mins = value % 60;

	function handleHoursChange(raw: string) {
		const h = Math.max(0, Math.min(23, Number(raw) || 0));
		const total = h * 60 + mins;
		onChange(total > 0 ? total : 1);
	}

	function handleMinutesChange(raw: string) {
		const m = Math.max(0, Math.min(59, Number(raw) || 0));
		const total = hours * 60 + m;
		onChange(total > 0 ? total : 1);
	}

	return { hours, mins, handleHoursChange, handleMinutesChange };
}
