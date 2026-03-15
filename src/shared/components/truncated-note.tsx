"use client";

import { MessageSquareText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

type TruncatedNoteProps = {
	text: string;
	maxLength?: number;
	popoverSide?: "top" | "bottom";
};

export function TruncatedNote({
	text,
	maxLength = 35,
	popoverSide = "bottom",
}: TruncatedNoteProps) {
	const isTruncated = text.length > maxLength;

	if (!isTruncated) {
		return (
			<span className="flex items-center gap-xs min-w-0">
				<MessageSquareText className="size-3 stroke-[1.5] text-content-faint shrink-0" />
				<span className="text-xs text-content-faint truncate">{text}</span>
			</span>
		);
	}

	return (
		<Popover>
			<PopoverTrigger className="flex items-center gap-xs text-left min-w-0 max-w-full overflow-hidden">
				<MessageSquareText className="size-3 stroke-[1.5] text-content-faint shrink-0" />
				<span className="text-xs text-content-faint truncate">{text}</span>
			</PopoverTrigger>
			<PopoverContent side={popoverSide} className="w-64 p-sm">
				<p className="text-xs text-content-muted">{text}</p>
			</PopoverContent>
		</Popover>
	);
}
