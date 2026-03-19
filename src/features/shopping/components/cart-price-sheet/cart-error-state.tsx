import { AlertTriangle } from "lucide-react";

type Props = {
	message: string;
};

export function CartErrorState({ message }: Props) {
	return (
		<div className="flex flex-1 items-center justify-center py-xl">
			<div className="flex flex-col items-center gap-md text-center px-md">
				<AlertTriangle className="size-8 text-warning" />
				<p className="text-sm text-content-muted">{message}</p>
			</div>
		</div>
	);
}
