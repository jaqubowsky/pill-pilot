"use client";

import { cn } from "@/shared/lib/utils";
import { CheckIcon } from "./check-icon";

type Props = {
	checked: boolean;
	pending?: boolean;
	disabled?: boolean;
	onClick: () => void;
	label: string;
};

export function SupplementCheckbox({ checked, pending, disabled, onClick, label }: Props) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: custom visual checkbox with SVG children requires button, not input
		<button
			type="button"
			aria-label={label}
			aria-checked={checked}
			role="checkbox"
			onClick={onClick}
			disabled={pending || disabled}
			className={cn(
				"flex min-h-11 min-w-11 items-center justify-center",
				(pending || disabled) && "opacity-70",
			)}
		>
			<span
				className={cn(
					"flex size-6 items-center justify-center rounded-full border-2 transition-all duration-200 ease-out",
					checked ? "border-brand-500 bg-brand-500" : "border-edge bg-transparent",
					checked && "animate-[check-pulse_200ms_ease-out]",
				)}
			>
				{checked && <CheckIcon className="size-3" />}
			</span>
		</button>
	);
}
