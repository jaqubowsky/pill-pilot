"use client";

import type * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

type LabeledInputProps = {
	label: string;
	error?: string;
	className?: string;
} & React.ComponentProps<"input">;

export function LabeledInput({ label, error, className, ...inputProps }: LabeledInputProps) {
	return (
		<div className="flex flex-col gap-xs">
			<Label className="text-sm text-content-muted">{label}</Label>
			<Input
				className={cn(
					"bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring",
					className,
				)}
				{...inputProps}
			/>
			{error && <p className="text-sm text-danger mt-xs">{error}</p>}
		</div>
	);
}
