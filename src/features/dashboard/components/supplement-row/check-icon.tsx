export function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 12 12"
			fill="none"
			stroke="white"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			style={{
				strokeDasharray: 24,
				strokeDashoffset: 0,
				animation: "check-mark 150ms ease-out forwards",
			}}
		>
			<polyline points="2,6 5,9 10,3" />
		</svg>
	);
}
