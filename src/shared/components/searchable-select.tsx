"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

type Option = { value: string; label: string };

type SearchableSelectProps = {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	options: Option[];
	placeholder?: string;
};

export function SearchableSelect({
	label,
	value,
	onValueChange,
	options,
	placeholder,
}: SearchableSelectProps) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const filtered = query
		? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
		: options;

	const selectedLabel = options.find((o) => o.value === value)?.label;

	return (
		<div className="flex flex-col gap-xs">
			<Label className="text-sm text-content-muted">{label}</Label>
			<Popover
				open={open}
				onOpenChange={(nextOpen) => {
					setOpen(nextOpen);
					if (!nextOpen) setQuery("");
				}}
			>
				<PopoverTrigger className="flex items-center justify-between w-full bg-surface-sunken border border-edge rounded-lg px-md py-sm text-sm text-left min-h-10">
					<span className={cn(!selectedLabel && "text-content-faint")}>
						{selectedLabel ?? placeholder ?? label}
					</span>
					<ChevronDown className="size-4 text-content-faint shrink-0" />
				</PopoverTrigger>
				<PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
					<div className="flex items-center gap-sm border-b border-edge px-sm py-xs">
						<Search className="size-4 text-content-faint shrink-0" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={placeholder ?? label}
							className="flex-1 bg-transparent text-sm outline-none placeholder:text-content-faint py-xs"
						/>
					</div>
					<div className="max-h-48 overflow-y-auto p-xs">
						{filtered.length === 0 ? (
							<p className="text-xs text-content-faint text-center py-sm">Brak wyników</p>
						) : (
							filtered.map((o) => (
								<button
									key={o.value}
									type="button"
									className={cn(
										"flex items-center gap-sm w-full rounded-md px-sm py-xs text-sm text-left hover:bg-surface-sunken transition-colors",
										o.value === value && "font-medium",
									)}
									onClick={() => {
										onValueChange(o.value);
										setOpen(false);
										setQuery("");
									}}
								>
									<Check
										className={cn(
											"size-3.5 shrink-0",
											o.value === value ? "opacity-100" : "opacity-0",
										)}
									/>
									{o.label}
								</button>
							))
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
