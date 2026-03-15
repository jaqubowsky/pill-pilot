"use client";

import type { LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

type StatusIconProps = {
	icon: LucideIcon;
	text: string;
	className?: string;
};

export function StatusIcon({
	icon: Icon,
	text,
	className = "text-content-faint",
}: StatusIconProps) {
	return (
		<Popover>
			<PopoverTrigger className={className}>
				<Icon className="size-3.5" />
			</PopoverTrigger>
			<PopoverContent className="text-xs w-64">{text}</PopoverContent>
		</Popover>
	);
}
