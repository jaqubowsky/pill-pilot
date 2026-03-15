"use client";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useTimeDurationInput } from "./use-time-duration-input";

type TimeDurationInputProps = {
	label: string;
	value: number;
	onChange: (minutes: number) => void;
};

export function TimeDurationInput({ label, value, onChange }: TimeDurationInputProps) {
	const { hours, mins, handleHoursChange, handleMinutesChange } = useTimeDurationInput(
		value,
		onChange,
	);

	return (
		<div className="flex flex-col gap-xs">
			<Label className="text-sm text-content-muted">{label}</Label>
			<div className="flex items-center gap-sm">
				<Input
					type="number"
					min="0"
					max="23"
					value={hours}
					onChange={(e) => handleHoursChange(e.target.value)}
					className="w-24 h-10 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base text-center"
				/>
				<span className="text-sm text-content-muted">h</span>
				<Input
					type="number"
					min="0"
					max="59"
					value={mins}
					onChange={(e) => handleMinutesChange(e.target.value)}
					className="w-24 h-10 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base text-center"
				/>
				<span className="text-sm text-content-muted">min</span>
			</div>
		</div>
	);
}
