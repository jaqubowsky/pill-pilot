import { PillBottleIcon } from "@/shared/components/pill-bottle-icon";

export function PageLoader() {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<PillBottleIcon className="size-12 animate-spin [animation-duration:1.5s]" />
		</div>
	);
}
