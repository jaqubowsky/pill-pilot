"use client";

import { AlertTriangle, Link2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { IconBadge } from "@/shared/components/icon-badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { SupplementPicker } from "./supplement-picker";
import type { CartItemState, SupplementOption } from "./use-cart-price-sheet";

type CartItemRowProps = {
	item: CartItemState;
	supplements: SupplementOption[];
	confidenceThreshold: number;
	onMatch: (id: string | null) => void;
	onPriceChange: (price: number) => void;
	onVerify: () => void;
	onSkip: () => void;
	onUnskip: () => void;
	onCreateNew: (name: string) => Promise<string | null>;
};

export function CartItemRow({
	item,
	supplements,
	confidenceThreshold,
	onMatch,
	onPriceChange,
	onVerify,
	onSkip,
	onUnskip,
	onCreateNew,
}: CartItemRowProps) {
	const t = useTranslations("shopping.cartPriceSheet");
	const tCommon = useTranslations("common");
	const [editOpen, setEditOpen] = useState(false);

	if (item.skipped) {
		return <SkippedRow productName={item.productName} onUnskip={onUnskip} />;
	}

	const isMatched = !!item.matchedSupplementId;
	const isVerified = item.verified;
	const isLowConfidence = isMatched && item.confidence < confidenceThreshold;
	const matchedName = isMatched
		? supplements.find((s) => s.id === item.matchedSupplementId)?.name
		: null;

	function handleSelect(id: string | null) {
		onMatch(id);
		if (id) {
			onVerify();
			setEditOpen(false);
		}
	}

	async function handleCreateNew(name: string) {
		const id = await onCreateNew(name);
		if (id) {
			onVerify();
			setEditOpen(false);
		}

		return id;
	}

	return (
		<div className="flex flex-col gap-xs py-xs">
			<div className="flex items-center gap-xs">
				<span className="text-sm font-medium text-content truncate min-w-0 flex-1">
					{item.productName}
				</span>
				<span className="text-xs text-content-muted whitespace-nowrap shrink-0">
					{item.price.toFixed(2)} {tCommon("currency")}
				</span>
				{isMatched && isVerified && (
					<IconBadge icon={Link2} variant="success" label={matchedName ?? ""} />
				)}
				{((isLowConfidence && !isVerified) || !isMatched) && (
					<button
						type="button"
						onClick={() => setEditOpen(true)}
						className="relative rounded-lg p-xs bg-warning-bg text-warning-text after:absolute after:inset-1/2 after:min-h-11 after:min-w-11 after:-translate-1/2 shrink-0"
					>
						<AlertTriangle className="size-4 stroke-[1.5]" />
					</button>
				)}
				<div className="flex items-center shrink-0">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setEditOpen(true)}
						className="active:scale-[0.98] transition-transform"
					>
						<Pencil className="size-4 text-content-faint stroke-[1.5]" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onSkip}
						className="active:scale-[0.98] transition-transform"
					>
						<Trash2 className="size-4 text-danger stroke-[1.5]" />
					</Button>
				</div>
			</div>

			{matchedName && <span className="text-xs text-content-faint truncate">→ {matchedName}</span>}

			{editOpen && (
				// biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay
				// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop overlay
				<div
					className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs"
					onClick={() => setEditOpen(false)}
				/>
			)}
			<BottomSheet
				open={editOpen}
				onOpenChange={setEditOpen}
				title={item.productName}
				scrollable
				footer={
					<Button
						className="w-full"
						onClick={() => {
							if (item.matchedSupplementId) onVerify();
							setEditOpen(false);
						}}
					>
						{t("done")}
					</Button>
				}
			>
				<div className="flex flex-col gap-lg">
					<div className="flex flex-col gap-sm">
						<label className="text-xs font-medium text-content-muted">{t("supplementLabel")}</label>
						<SupplementPicker
							supplements={supplements}
							value={item.matchedSupplementId}
							onChange={handleSelect}
							onCreateNew={handleCreateNew}
							suggestedName={item.productName}
							placeholder={t("selectSupplement")}
						/>
					</div>

					<div className="flex flex-col gap-sm">
						<label className="text-xs font-medium text-content-muted">{t("priceLabel")}</label>
						<div className="flex items-center gap-sm">
							<Input
								type="number"
								inputMode="decimal"
								min={0}
								step={0.01}
								value={item.price}
								onChange={(e) => {
									const val = parseFloat(e.target.value);
									if (!Number.isNaN(val)) onPriceChange(val);
								}}
								className="w-28 h-11 text-right text-sm px-sm bg-surface-sunken border-edge rounded-lg"
							/>
							<span className="text-sm text-content-faint">{tCommon("currency")}</span>
						</div>
					</div>
				</div>
			</BottomSheet>
		</div>
	);
}

function SkippedRow({ productName, onUnskip }: { productName: string; onUnskip: () => void }) {
	return (
		<div className="flex items-center justify-between py-xs opacity-40">
			<span className="text-sm text-content-muted line-through truncate flex-1 min-w-0">
				{productName}
			</span>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={onUnskip}
				className="active:scale-[0.98] transition-transform"
			>
				<RotateCcw className="size-4 text-brand-600 stroke-[1.5]" />
			</Button>
		</div>
	);
}
