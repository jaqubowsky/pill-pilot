export function PillBottleIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			stroke="var(--color-brand-300)"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<rect x="20" y="8" width="24" height="48" rx="12" />
			<line x1="26" y1="24" x2="38" y2="24" />
			<line x1="26" y1="32" x2="38" y2="32" />
			<line x1="26" y1="40" x2="38" y2="40" />
		</svg>
	);
}
