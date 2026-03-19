import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

type Props = {
	text: string;
	popoverSide?: "top" | "bottom" | "left" | "right";
};

export function TruncatedNote({ text, popoverSide = "top" }: Props) {
	return (
		<Popover>
			<PopoverTrigger className="text-xs text-content-faint truncate max-w-full text-left">
				{text}
			</PopoverTrigger>
			<PopoverContent side={popoverSide} className="w-auto max-w-52 p-sm text-xs">
				{text}
			</PopoverContent>
		</Popover>
	);
}
