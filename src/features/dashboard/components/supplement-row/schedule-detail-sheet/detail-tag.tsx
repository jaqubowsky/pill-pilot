type Props = {
	label: string;
};

export function DetailTag({ label }: Props) {
	return (
		<span className="inline-flex items-center rounded-md bg-surface-sunken px-sm py-xs text-xs font-medium text-content-muted">
			{label}
		</span>
	);
}
