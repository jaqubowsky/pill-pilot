"use client";

import type * as React from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";

type BottomSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	scrollable?: boolean;
	children: React.ReactNode;
	footer?: React.ReactNode;
};

export function BottomSheet({
	open,
	onOpenChange,
	title,
	description,
	scrollable,
	children,
	footer,
}: BottomSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				showCloseButton={false}
				initialFocus={false}
				className={cn(
					"rounded-t-2xl bg-surface-raised p-lg",
					scrollable && "max-h-[90vh] flex flex-col overflow-hidden",
				)}
			>
				<div className="mx-auto mb-md h-1 w-10 rounded-full bg-edge-subtle shrink-0" />
				<SheetHeader className="p-0 mb-lg shrink-0">
					<SheetTitle className="text-lg font-semibold text-content">{title}</SheetTitle>
					<SheetDescription className={cn("text-sm text-content-muted", !description && "hidden")}>
						{description}
					</SheetDescription>
				</SheetHeader>
				{scrollable ? (
					<div className="overflow-y-auto overflow-x-hidden min-h-0 min-w-0 flex-1 pr-xs">
						{children}
					</div>
				) : (
					children
				)}
				{footer && <div className="shrink-0 pt-md">{footer}</div>}
			</SheetContent>
		</Sheet>
	);
}
