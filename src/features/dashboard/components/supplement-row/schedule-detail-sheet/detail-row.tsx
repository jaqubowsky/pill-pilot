export type DetailRowDef = {
	key: string;
	label: string;
	value: string;
};

type Props = {
	label: string;
	value: string;
};

export function DetailRow({ label, value }: Props) {
	return (
		<div className="flex justify-between gap-sm py-sm">
			<span className="text-sm text-content-muted shrink-0">{label}</span>
			<span className="text-sm text-content text-right">{value}</span>
		</div>
	);
}
