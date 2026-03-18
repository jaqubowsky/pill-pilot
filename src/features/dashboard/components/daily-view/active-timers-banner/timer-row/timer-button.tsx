import type { ReactNode } from "react";

type Props = {
	onClick: () => void;
	children: ReactNode;
};

export function TimerButton({ onClick, children }: Props) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-0.5 px-sm py-xs rounded-lg text-xs font-medium text-content-faint hover:bg-surface-sunken active:bg-surface-sunken min-h-11 min-w-11"
		>
			{children}
		</button>
	);
}
