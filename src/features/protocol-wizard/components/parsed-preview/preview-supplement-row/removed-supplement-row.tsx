"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

type RemovedSupplementRowProps = {
	name: string;
	onRestore: () => void;
	style?: React.CSSProperties;
	nodeRef?: React.Ref<HTMLDivElement>;
};

export function RemovedSupplementRow({
	name,
	onRestore,
	style,
	nodeRef,
}: RemovedSupplementRowProps) {
	return (
		<div ref={nodeRef} style={style} className="flex items-center justify-between py-xs opacity-40">
			<span className="text-sm text-content-muted line-through truncate flex-1 min-w-0">
				{name}
			</span>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={onRestore}
				className="active:scale-[0.98] transition-transform"
			>
				<RotateCcw className="size-4 text-brand-600 stroke-[1.5]" />
			</Button>
		</div>
	);
}
