"use client";

import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	Loader2,
	Plus,
	RotateCcw,
	Search,
	ShoppingCart,
	Trash2,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import type { CartItemState, ShopOption, SupplementOption } from "./use-cart-price-sheet";
import { useCartPriceSheet } from "./use-cart-price-sheet";

type CartPriceSheetProps = {
	supplements: SupplementOption[];
	shops: ShopOption[];
	onSaved?: () => void;
	trigger?: React.ReactNode;
};

function SupplementPicker({
	supplements,
	value,
	onChange,
	onCreateNew,
	suggestedName,
	placeholder,
}: {
	supplements: SupplementOption[];
	value: string | null | undefined;
	onChange: (id: string | null) => void;
	onCreateNew?: (name: string) => Promise<string | null>;
	suggestedName?: string;
	placeholder: string;
}) {
	const [isCreating, setIsCreating] = useState(false);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);

	const selected = value ? supplements.find((s) => s.id === value) : null;
	const filtered = query
		? supplements.filter((s) => {
				const label = s.name + (s.brandName ?? "");
				return label.toLowerCase().includes(query.toLowerCase());
			})
		: supplements;

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => {
					setOpen(true);
					setTimeout(() => searchRef.current?.focus(), 0);
				}}
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
		<div className="flex-1 flex flex-col gap-xs">
			<div className="flex items-center gap-sm border border-edge rounded-lg px-sm py-xs bg-surface-sunken">
				<Search className="size-4 text-content-faint shrink-0" />
				<input
					ref={searchRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onBlur={() => setTimeout(() => setOpen(false), 200)}
					placeholder={placeholder}
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-content-faint py-xs"
				/>
			</div>
			<div className="max-h-40 overflow-y-auto rounded-lg border border-edge-subtle bg-surface-raised">
				{onCreateNew && (
					<button
						type="button"
						disabled={isCreating}
						onMouseDown={async (e) => {
							e.preventDefault();
							setIsCreating(true);
							const name = query.trim() || suggestedName || "Nowy suplement";
							const newId = await onCreateNew(name);
							setIsCreating(false);
							if (newId) {
								onChange(newId);
								setOpen(false);
								setQuery("");
							}
						}}
						className="w-full flex items-center gap-xs text-left px-sm py-sm text-sm text-brand-600 font-medium hover:bg-surface-sunken transition-colors border-b border-edge-subtle"
					>
						<Plus className="size-4 shrink-0" />
						{isCreating ? "Tworzę..." : `Dodaj „${query.trim() || suggestedName || "nowy"}"`}
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
								onChange(s.id);
								setOpen(false);
								setQuery("");
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

function CartItemRow({
	item,
	supplements,
	confidenceThreshold,
	onMatch,
	onVerify,
	onSkip,
	onUnskip,
	onCreateNew,
}: {
	item: CartItemState;
	supplements: SupplementOption[];
	confidenceThreshold: number;
	onMatch: (id: string | null) => void;
	onVerify: () => void;
	onSkip: () => void;
	onUnskip: () => void;
	onCreateNew: (name: string) => Promise<string | null>;
}) {
	const needsInput =
		!item.matchedSupplementId ||
		(item.matchedSupplementId && item.confidence < confidenceThreshold && !item.verified);
	const [expanded, setExpanded] = useState(needsInput);

	if (item.skipped) {
		return (
			<div className="flex items-center justify-between py-xs opacity-40">
				<span className="text-sm text-content-muted line-through truncate flex-1 min-w-0">
					{item.productName}
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
			setExpanded(false);
		}
	}

	return (
		<div className="flex flex-col gap-xs py-sm">
			<div className="flex items-center gap-sm">
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-content truncate">{item.productName}</p>
					<p className="text-xs text-content-muted">
						{item.price.toFixed(2)} zł
						{matchedName && <span className="text-content-faint"> → {matchedName}</span>}
					</p>
				</div>

				<div className="flex items-center shrink-0">
					{isVerified && !isLowConfidence && (
						<button
							type="button"
							onClick={() => setExpanded(!expanded)}
							className="inline-flex items-center justify-center size-9 rounded-lg bg-success-bg active:scale-[0.95] transition-transform"
						>
							<CheckCircle className="size-4 text-brand-700" />
						</button>
					)}
					{isLowConfidence && !isVerified && (
						<button
							type="button"
							onClick={() => setExpanded(!expanded)}
							className="inline-flex items-center justify-center size-9 rounded-lg bg-warning-bg active:scale-[0.95] transition-transform"
						>
							<AlertTriangle className="size-4 text-[#8B6914]" />
						</button>
					)}
					{!isMatched && (
						<button
							type="button"
							onClick={() => setExpanded(!expanded)}
							className="inline-flex items-center justify-center size-9 rounded-lg bg-danger-bg active:scale-[0.95] transition-transform"
						>
							<XCircle className="size-4 text-danger" />
						</button>
					)}
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

			{expanded && (
				<SupplementPicker
					supplements={supplements}
					value={item.matchedSupplementId}
					onChange={handleSelect}
					onCreateNew={async (name) => {
						const id = await onCreateNew(name);
						if (id) {
							onVerify();
							setExpanded(false);
						}
						return id;
					}}
					suggestedName={item.productName}
					placeholder="Wybierz suplement"
				/>
			)}
		</div>
	);
}

export function CartPriceSheet({ supplements, shops, onSaved, trigger }: CartPriceSheetProps) {
	const t = useTranslations("shopping.cartPriceSheet");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const fileInputId = "cart-file-input";
	const [shopEditOpen, setShopEditOpen] = useState(false);

	const {
		isOpen,
		isUploading,
		isSaving,
		error,
		items,
		localSupplements,
		handleCreateSupplement,
		shopName,
		setShopName,
		selectedShopId,
		setSelectedShopId,
		shopDeliveryCost,
		setShopDeliveryCost,
		shopFreeThreshold,
		setShopFreeThreshold,
		unverifiedCount,
		canSave,
		closeSheet,
		handleFileUpload,
		handleMatchChange,
		handleVerify,
		handleSkip,
		handleUnskip,
		handleSave,
		CART_CONFIDENCE_THRESHOLD,
	} = useCartPriceSheet({
		supplements,
		shops,
		onSaved: onSaved ?? (() => {}),
	});

	function handleTriggerClick() {
		fileInputRef.current?.click();
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			handleFileUpload(file);
		}
		e.target.value = "";
	}

	return (
		<>
			<input
				id={fileInputId}
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="sr-only"
				onChange={handleFileChange}
			/>

			{trigger ? (
				<label htmlFor={fileInputId} className="contents cursor-pointer">
					{trigger}
				</label>
			) : (
				<Button variant="outline" onClick={handleTriggerClick} className="gap-xs">
					<ShoppingCart className="size-4" />
					{t("scanCart")}
				</Button>
			)}

			<Sheet
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) closeSheet();
				}}
			>
				<SheetContent side="bottom" className="max-h-[90dvh] overflow-hidden flex flex-col p-0">
					<SheetHeader className="shrink-0 p-md pb-0">
						<SheetTitle>{t("title")}</SheetTitle>
					</SheetHeader>

					{isUploading ? (
						<div className="flex flex-1 items-center justify-center py-xl">
							<div className="flex flex-col items-center gap-md text-content-muted">
								<Loader2 className="size-8 animate-spin" />
								<p className="text-sm">{t("analysing")}</p>
							</div>
						</div>
					) : error ? (
						<div className="flex flex-1 items-center justify-center py-xl">
							<div className="flex flex-col items-center gap-md text-center px-md">
								<AlertTriangle className="size-8 text-warning" />
								<p className="text-sm text-content-muted">{error}</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										closeSheet();
										fileInputRef.current?.click();
									}}
								>
									{t("scanCart")}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-md overflow-y-auto flex-1 min-h-0 px-md pb-sm">
							<div className="flex flex-col gap-sm">
								<label className="text-xs font-medium text-content-muted">{t("shopLabel")}</label>
								<Input
									value={shopName}
									onChange={(e) => {
										setShopName(e.target.value);
										setSelectedShopId(null);
									}}
									placeholder={t("shopPlaceholder")}
									className="bg-surface-sunken border-edge rounded-lg"
								/>
								<div className="flex gap-sm">
									{shops.length > 0 && (
										<Select
											value={selectedShopId ?? ""}
											onValueChange={(val) => {
												setSelectedShopId(val || null);
												const shop = shops.find((s) => s.id === val);
												if (shop) setShopName(shop.name);
											}}
										>
											<SelectTrigger className="flex-1 h-9 bg-surface-sunken border-edge rounded-lg">
												<SelectValue>
													{selectedShopId
														? shops.find((s) => s.id === selectedShopId)?.name
														: t("selectShop")}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{shops.map((shop) => (
													<SelectItem key={shop.id} value={shop.id}>
														{shop.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => setShopEditOpen(true)}
									>
										<Plus className="size-4" />
										{t("addShop")}
									</Button>
								</div>
							</div>

							{unverifiedCount > 0 && (
								<div className="rounded-xl bg-warning-bg border border-warning/20 p-md">
									<p className="text-sm text-[#8B6914]">
										{t("requiresVerification", { count: unverifiedCount })}
									</p>
								</div>
							)}

							<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm overflow-hidden px-md">
								{items.map((item, idx) => (
									<div
										key={item._id}
										className={idx < items.length - 1 ? "border-b border-edge-subtle" : ""}
									>
										<CartItemRow
											item={item}
											supplements={localSupplements}
											confidenceThreshold={CART_CONFIDENCE_THRESHOLD}
											onMatch={(id) => handleMatchChange(item._id, id)}
											onVerify={() => handleVerify(item._id)}
											onSkip={() => handleSkip(item._id)}
											onUnskip={() => handleUnskip(item._id)}
											onCreateNew={handleCreateSupplement}
										/>
									</div>
								))}
							</div>
						</div>
					)}

					<SheetFooter className="shrink-0 flex flex-col gap-sm p-md mt-0">
						<Button onClick={handleSave} disabled={!canSave || isSaving} className="w-full">
							{isSaving ? t("saving") : t("savePrices")}
						</Button>
						<Button variant="outline" onClick={closeSheet} className="w-full">
							{t("cancel")}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<ShopEditSheet shop={null} open={shopEditOpen} onOpenChange={setShopEditOpen} />
		</>
	);
}
