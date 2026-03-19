"use client";

import { combineToMinutes, splitMinutes } from "@/shared/lib/format-time";

export function useTimeDurationInput(value: number, onChange: (minutes: number) => void) {
	const { hours, mins } = splitMinutes(value);

	function handleHoursChange(raw: string) {
		onChange(combineToMinutes(Number(raw) || 0, mins, { min: 1 }));
	}

	function handleMinutesChange(raw: string) {
		onChange(combineToMinutes(hours, Number(raw) || 0, { min: 1 }));
	}

	return { hours, mins, handleHoursChange, handleMinutesChange };
}
