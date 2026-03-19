"use client";

import { ChevronDown, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SupplementOption } from "../use-cart-price-sheet";
import { useSupplementPicker } from "./use-supplement-picker";

export type SupplementPickerProps = {
	supplements: SupplementOption[];
	value: string | null | undefined;
	onChange: (id: string | null) => void;
	onCreateNew?: (name: string) => Promise<string | null>;
	suggestedName?: string;
	placeholder: string;
};

export function SupplementPicker({
	supplements,
	value,
	onChange,
	onCreateNew,
	suggestedName,
	placeholder,
}: SupplementPickerProps) {
	const t = useTranslations("shopping.cartPriceSheet");

	const {
		isCreating,
		setIsCreating,
		open,
		setOpen,
		query,
		setQuery,
		selected,
		filtered,
		selectAndClose,
	} = useSupplementPicker({ supplements, value });

	async function handleCreateNew(e: React.MouseEvent) {
		e.preventDefault();
		if (!onCreateNew) return;

		setIsCreating(true);

		const name = query.trim() || suggestedName || t("newSupplement");
		const newId = await onCreateNew(name);

		setIsCreating(false);

		if (newId) selectAndClose(newId, onChange);
	}

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex-1 flex items-center justify-between min-h-11 px-sm text-sm bg-surface-sunken border border-edge rounded-lg text-left min-w-0"
			>
				<span className={`truncate ${selected ? "text-content" : "text-content-faint"}`}>
					{selected?.name ?? placeholder}
				</span>
				<ChevronDown className="size-3.5 text-content-faint shrink-0 ml-xs" />
			</button>
		);
	}

	return (
		<div className="flex-1 relative flex flex-col gap-xs">
			<div className="flex items-center gap-sm border border-edge rounded-lg px-sm py-xs bg-surface-sunken">
				<Search className="size-4 text-content-faint shrink-0" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onBlur={() => setTimeout(() => setOpen(false), 200)}
					placeholder={placeholder}
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-content-faint py-xs"
				/>
			</div>
			<div className="absolute top-full left-0 right-0 z-20 mt-xs max-h-52 overflow-y-auto rounded-lg border border-edge-subtle bg-surface-raised shadow-lg">
				{onCreateNew && (
					<button
						type="button"
						disabled={isCreating}
						onMouseDown={handleCreateNew}
						className="w-full flex items-center gap-xs text-left px-sm py-sm text-sm text-brand-600 font-medium hover:bg-surface-sunken transition-colors border-b border-edge-subtle"
					>
						<Plus className="size-4 shrink-0" />
						{isCreating
							? t("creating")
							: t("addSupplement", {
									name: query.trim() || suggestedName || t("newSupplement"),
								})}
					</button>
				)}
				{filtered.length === 0 && !onCreateNew ? (
					<p className="text-xs text-content-faint text-center py-md">—</p>
				) : (
					filtered.map((s) => (
						<button
							key={s.id}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								selectAndClose(s.id, onChange);
							}}
							className={`flex flex-col gap-0.5 w-full text-left rounded-lg px-sm py-sm hover:bg-surface-sunken transition-colors ${s.id === value ? "text-brand-600" : ""}`}
						>
							<span
								className={`text-sm ${s.id === value ? "font-medium text-brand-600" : "text-content"}`}
							>
								{s.name}
							</span>
							{s.brandName && <span className="text-xs text-content-faint">{s.brandName}</span>}
						</button>
					))
				)}
			</div>
		</div>
	);
}
