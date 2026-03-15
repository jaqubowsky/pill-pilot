"use client";

import { Info } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Switch } from "@/shared/components/ui/switch";

type ToggleRowProps = {
	label: string;
	hint?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
};

export function ToggleRow({ label, hint, checked, onCheckedChange, disabled }: ToggleRowProps) {
	return (
		<div className="flex items-center justify-between gap-sm min-h-11">
			<div className="flex items-center gap-xs">
				<Label className="text-sm text-content-muted">{label}</Label>
				{hint && (
					<Popover>
						<PopoverTrigger className="relative p-1 text-content-faint after:absolute after:inset-1/2 after:min-h-11 after:min-w-11 after:-translate-1/2">
							<Info className="size-4" />
						</PopoverTrigger>
						<PopoverContent className="text-xs w-64">{hint}</PopoverContent>
					</Popover>
				)}
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
		</div>
	);
}
