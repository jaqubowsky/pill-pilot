"use client";

import type { LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

type IconBadgeProps = {
	icon: LucideIcon;
	label: string;
	variant?: "default" | "brand" | "amber" | "muted" | "danger" | "info" | "success";
};

const variantStyles = {
	default: "bg-brand-50 text-content-faint",
	brand: "bg-brand-100 text-brand-700",
	amber: "bg-warning-bg text-[#8B6914]",
	muted: "bg-brand-50 text-content-muted",
	danger: "bg-danger-bg text-danger",
	info: "bg-info-bg text-[#2D6070]",
	success: "bg-success-bg text-brand-700",
} as const;

export function IconBadge({ icon: Icon, label, variant = "default" }: IconBadgeProps) {
	return (
		<Popover>
			<PopoverTrigger className={cn("rounded-lg p-xs", variantStyles[variant])}>
				<Icon className="size-3.5 stroke-[1.5]" />
			</PopoverTrigger>
			<PopoverContent className="w-auto max-w-52 p-sm text-xs">{label}</PopoverContent>
		</Popover>
	);
}
