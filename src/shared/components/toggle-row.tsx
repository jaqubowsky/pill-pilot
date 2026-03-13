"use client";

import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

type ToggleRowProps = {
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
};

export function ToggleRow({ label, checked, onCheckedChange, disabled }: ToggleRowProps) {
	return (
		<div className="flex items-center justify-between gap-sm min-h-11">
			<Label className="text-sm text-content-muted">{label}</Label>
			<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
		</div>
	);
}
