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
};

export function BottomSheet({
	open,
	onOpenChange,
	title,
	description,
	scrollable,
	children,
}: BottomSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				showCloseButton={false}
				className={cn(
					"rounded-t-2xl bg-surface-raised p-lg",
					scrollable && "max-h-[90vh] overflow-y-auto",
				)}
			>
				<div className="mx-auto mb-md h-1 w-10 rounded-full bg-edge-subtle" />
				<SheetHeader className="p-0 mb-lg">
					<SheetTitle className="text-lg font-semibold text-content">{title}</SheetTitle>
					{description && (
						<SheetDescription className="text-sm text-content-muted">
							{description}
						</SheetDescription>
					)}
				</SheetHeader>
				{children}
			</SheetContent>
		</Sheet>
	);
}
