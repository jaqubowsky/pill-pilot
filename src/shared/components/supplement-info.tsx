"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import type { DosageUnit } from "@/shared/db/schema";
import { formatQuantity } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { TruncatedNote } from "./truncated-note";

type SupplementInfoProps = {
	name: string;
	dosageAmount: string | number;
	dosageUnit: DosageUnit;
	notes?: string | null;
	nameClassName?: string;
	badges?: ReactNode;
	warning?: ReactNode;
	notesPopoverSide?: "top" | "bottom";
};

export function SupplementInfo({
	name,
	dosageAmount,
	dosageUnit,
	notes,
	nameClassName,
	badges,
	warning,
	notesPopoverSide = "bottom",
}: SupplementInfoProps) {
	const t = useTranslations("dashboard");

	return (
		<div className="flex flex-col gap-xs min-w-0 flex-1">
			<div className="flex items-center gap-xs min-w-0">
				<Popover>
					<PopoverTrigger
						className={cn(
							"text-sm font-medium text-content truncate min-w-0 shrink text-left",
							nameClassName,
						)}
					>
						{name}
					</PopoverTrigger>
					<PopoverContent className="w-auto max-w-64 p-sm text-sm font-medium">
						{name}
					</PopoverContent>
				</Popover>
				<span className="text-xs text-content-muted whitespace-nowrap shrink-0">
					{formatQuantity(dosageAmount)} {t(`units.${dosageUnit}`)}
				</span>
				{badges && <div className="flex items-center gap-xs shrink-0">{badges}</div>}
			</div>
			{notes && <TruncatedNote text={notes} popoverSide={notesPopoverSide} />}
			{warning}
		</div>
	);
}
