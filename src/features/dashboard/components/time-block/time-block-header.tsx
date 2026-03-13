import * as LucideIcons from "lucide-react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { TimeBlockProgress } from "./time-block-progress";

type Props = {
	icon: string;
	name: string;
	startTime: string;
	completed: number;
	total: number;
	isOpen: boolean;
};

function BlockIcon({ name }: { name: string }) {
	const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;
	const Icon = iconMap[name];

	if (!Icon) return null;
	return <Icon className="size-5" strokeWidth={1.5} />;
}

export function TimeBlockHeader({ icon, name, startTime, completed, total, isOpen }: Props) {
	const isComplete = total > 0 && completed === total;

	return (
		<div
			className={cn(
				"flex min-h-12 w-full items-center gap-sm rounded-xl p-md transition-colors",
				isComplete && "bg-success-bg",
			)}
		>
			<span className="text-content-muted">
				<BlockIcon name={icon} />
			</span>
			<div className="flex flex-1 flex-col gap-xs">
				<span className="text-xs font-semibold uppercase tracking-wide text-content">{name}</span>
				<span className="text-xs text-content-faint">{startTime}</span>
			</div>
			<TimeBlockProgress completed={completed} total={total} />
			<ChevronDown
				className={cn(
					"size-4 text-content-faint transition-transform duration-200",
					isOpen && "rotate-180",
				)}
			/>
		</div>
	);
}
