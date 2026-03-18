export function CardActionSection({ children }: { children: React.ReactNode }) {
	return (
		<div className="px-md pb-md pt-sm border-t border-edge-subtle flex flex-col gap-sm">
			{children}
		</div>
	);
}
