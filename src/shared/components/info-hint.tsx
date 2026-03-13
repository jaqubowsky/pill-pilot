"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

type InfoHintProps = {
	text: string;
};

export function InfoHint({ text }: InfoHintProps) {
	const [open, setOpen] = useState(false);

	return (
		<span className="relative inline-flex">
			<button
				type="button"
				className="text-content-faint hover:text-content-muted transition-colors"
				onClick={() => setOpen(!open)}
				aria-label="Info"
			>
				<Info className="size-4" />
			</button>
			<span
				className={cn(
					"absolute left-1/2 -translate-x-1/2 top-full mt-xs z-10 w-56 rounded-lg bg-surface-raised border border-edge-subtle shadow-md p-sm text-xs text-content-muted transition-opacity",
					open ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
			>
				{text}
			</span>
		</span>
	);
}
