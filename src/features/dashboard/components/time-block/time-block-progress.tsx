import { cn } from "@/shared/lib/utils";

type Props = {
	completed: number;
	total: number;
};

export function TimeBlockProgress({ completed, total }: Props) {
	const isComplete = total > 0 && completed === total;
	const isEmpty = completed === 0;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide",
				isComplete && "bg-success-bg text-brand-700",
				isEmpty && "bg-edge-subtle text-content-muted",
				!isComplete && !isEmpty && "bg-brand-50 text-content-muted",
			)}
		>
			{completed}/{total}
		</span>
	);
}
