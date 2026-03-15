"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ExistingSupplementSummary } from "@/features/protocol-wizard/types";
import { BottomSheet } from "@/shared/components/bottom-sheet";

type ExistingSupplementPickerProps = {
	supplements: ExistingSupplementSummary[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPick: (supplement: ExistingSupplementSummary) => void;
};

export function ExistingSupplementPicker({
	supplements,
	open,
	onOpenChange,
	onPick,
}: ExistingSupplementPickerProps) {
	const t = useTranslations();
	const [query, setQuery] = useState("");

	const filtered = query
		? supplements.filter((s) => {
				const label = s.name + (s.brandName ?? "");
				return label.toLowerCase().includes(query.toLowerCase());
			})
		: supplements;

	return (
		<BottomSheet
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) setQuery("");
			}}
			title={t("protocolWizard.manual.pickExisting")}
			scrollable
		>
			<div className="flex flex-col gap-sm">
				<div className="flex items-center gap-sm border border-edge rounded-lg px-sm py-xs bg-surface-sunken">
					<Search className="size-4 text-content-faint shrink-0" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("protocolWizard.manual.pickExisting")}
						className="flex-1 bg-transparent text-sm outline-none placeholder:text-content-faint py-xs"
					/>
				</div>
				<div className="flex flex-col">
					{filtered.length === 0 ? (
						<p className="text-xs text-content-faint text-center py-md">Brak wyników</p>
					) : (
						filtered.map((s) => (
							<button
								key={s.id}
								type="button"
								className="flex flex-col gap-0.5 w-full text-left rounded-lg px-sm py-sm hover:bg-surface-sunken transition-colors"
								onClick={() => {
									onPick(s);
									setQuery("");
								}}
							>
								<span className="text-sm font-medium text-content">{s.name}</span>
								{s.brandName && (
									<span className="text-xs text-content-faint">{s.brandName}</span>
								)}
							</button>
						))
					)}
				</div>
			</div>
		</BottomSheet>
	);
}
