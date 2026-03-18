type SectionHeaderProps = {
	label: string;
};

export function SectionHeader({ label }: SectionHeaderProps) {
	return (
		<p className="text-xs uppercase tracking-wide text-content-faint font-semibold mb-sm">
			{label}
		</p>
	);
}
