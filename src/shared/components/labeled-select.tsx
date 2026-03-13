"use client";

import type * as React from "react";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

type LabeledSelectProps = {
	label: string;
	value: string;
	onValueChange: (value: string | null) => void;
	triggerClassName?: string;
	displayValue: React.ReactNode;
	children: React.ReactNode;
};

export function LabeledSelect({
	label,
	value,
	onValueChange,
	triggerClassName,
	displayValue,
	children,
}: LabeledSelectProps) {
	return (
		<div className="flex flex-col gap-xs">
			<Label className="text-sm text-content-muted">{label}</Label>
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger
					className={cn("w-full bg-surface-sunken border-edge rounded-lg", triggerClassName)}
				>
					<SelectValue>{displayValue}</SelectValue>
				</SelectTrigger>
				<SelectContent>{children}</SelectContent>
			</Select>
		</div>
	);
}
