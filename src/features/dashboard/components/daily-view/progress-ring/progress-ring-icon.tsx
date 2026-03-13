type Props = {
	size: number;
	stroke: number;
	radius: number;
	circumference: number;
	offset: number;
};

export function ProgressRingIcon({ size, stroke, radius, circumference, offset }: Props) {
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			style={{ transform: "rotate(-90deg)" }}
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="var(--color-brand-100)"
				strokeWidth={stroke}
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="var(--color-brand-500)"
				strokeWidth={stroke}
				strokeLinecap="round"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				style={{
					transition: "stroke-dashoffset 600ms ease-out 200ms",
				}}
			/>
		</svg>
	);
}
