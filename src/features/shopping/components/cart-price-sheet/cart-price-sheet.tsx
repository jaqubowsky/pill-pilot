"use client";

import {
	AlertTriangle,
	Check,
	ChevronDown,
	Clock,
	Link2,
	Loader2,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	ShoppingCart,
	Store,
	Trash2,
	X,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { deleteCartScan } from "@/features/shopping/api/actions/delete-cart-scan";
import { ShopEditSheet } from "@/features/shopping/components/shop-edit-sheet";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { IconBadge } from "@/shared/components/icon-badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
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

type RecentScanSummary = {
	id: string;
	status: "processing" | "completed" | "failed";
	shopName: string | null;
	items: {
		productName: string;
		price: number;
		matchedSupplementId?: string | null;
		confidence: number;
	}[];
	createdAt: Date;
};

type CartPriceSheetProps = {
	supplements: SupplementOption[];
	shops: ShopOption[];
	recentScans?: RecentScanSummary[];
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
		<div className="flex-1 relative flex flex-col gap-xs">
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
			<div className="absolute top-full left-0 right-0 z-20 mt-xs max-h-52 overflow-y-auto rounded-lg border border-edge-subtle bg-surface-raised shadow-lg">
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
	onPriceChange,
	onVerify,
	onSkip,
	onUnskip,
	onCreateNew,
}: {
	item: CartItemState;
	supplements: SupplementOption[];
	confidenceThreshold: number;
	onMatch: (id: string | null) => void;
	onPriceChange: (price: number) => void;
	onVerify: () => void;
	onSkip: () => void;
	onUnskip: () => void;
	onCreateNew: (name: string) => Promise<string | null>;
}) {
	const [editOpen, setEditOpen] = useState(false);

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
			setEditOpen(false);
		}
	}

	return (
		<div className="flex flex-col gap-xs py-xs">
			<div className="flex items-center gap-xs">
				<span className="text-sm font-medium text-content truncate min-w-0 flex-1">
					{item.productName}
				</span>
				<span className="text-xs text-content-muted whitespace-nowrap shrink-0">
					{item.price.toFixed(2)} zł
				</span>
				{isMatched && isVerified && (
					<IconBadge icon={Link2} variant="success" label={matchedName ?? ""} />
				)}
				{((isLowConfidence && !isVerified) || !isMatched) && (
					<button
						type="button"
						onClick={() => setEditOpen(true)}
						className="relative rounded-lg p-xs bg-warning-bg text-[#8B6914] after:absolute after:inset-1/2 after:min-h-11 after:min-w-11 after:-translate-1/2 shrink-0"
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
				<div
					className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs"
					onClick={() => setEditOpen(false)}
					onKeyDown={() => {}}
					role="presentation"
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
						Gotowe
					</Button>
				}
			>
				<div className="flex flex-col gap-lg">
					<div className="flex flex-col gap-sm">
						<label className="text-xs font-medium text-content-muted">Suplement</label>
						<SupplementPicker
							supplements={supplements}
							value={item.matchedSupplementId}
							onChange={handleSelect}
							onCreateNew={async (name) => {
								const id = await onCreateNew(name);
								if (id) {
									onVerify();
									setEditOpen(false);
								}
								return id;
							}}
							suggestedName={item.productName}
							placeholder="Wybierz suplement"
						/>
					</div>

					<div className="flex flex-col gap-sm">
						<label className="text-xs font-medium text-content-muted">Cena</label>
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
							<span className="text-sm text-content-faint">zł</span>
						</div>
					</div>
				</div>
			</BottomSheet>
		</div>
	);
}

export function CartPriceSheet({
	supplements,
	shops,
	recentScans,
	onSaved,
	trigger,
}: CartPriceSheetProps) {
	const t = useTranslations("shopping.cartPriceSheet");
	const tCommon = useTranslations("common");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const fileInputId = "cart-file-input";
	const [shopEditOpen, setShopEditOpen] = useState(false);
	const [deleteScanId, setDeleteScanId] = useState<string | null>(null);

	const {
		isOpen,
		isSaving,
		error,
		items,
		localSupplements,
		handleCreateSupplement,
		setShopName,
		selectedShopId,
		setSelectedShopId,
		unverifiedCount,
		canSave,
		closeSheet,
		loadScan,
		handleFileUpload,
		handleMatchChange,
		handlePriceChange,
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

			{recentScans && recentScans.length > 0 && (
				<div className="flex flex-col gap-sm">
					<div className="flex items-center gap-xs">
						<Clock size={14} className="text-content-faint stroke-[1.5]" />
						<span className="text-xs font-semibold uppercase tracking-wide text-content-faint">
							{t("recentScans")}
						</span>
					</div>
					<div className="flex gap-sm overflow-x-auto pb-xs -mx-md px-md scrollbar-none">
						{recentScans.map((scan) => (
							<div key={scan.id} className="relative shrink-0">
								<button
									type="button"
									onClick={() => setDeleteScanId(scan.id)}
									className="absolute top-xs right-xs text-content-faint hover:text-content-muted z-10 after:absolute after:inset-1/2 after:min-h-11 after:min-w-11 after:-translate-1/2"
								>
									<X className="size-3.5" />
								</button>
								{scan.status === "processing" ? (
									<div className="flex flex-col gap-xs rounded-xl border border-brand-200 bg-brand-50/50 p-sm pr-lg min-w-[140px] max-w-[160px]">
										<div className="flex items-center gap-xs">
											<Loader2 className="size-3.5 animate-spin text-brand-600" />
											<span className="text-sm font-medium text-brand-600">{t("analysing")}</span>
										</div>
										<span className="text-xs text-content-faint">
											{scan.createdAt.toLocaleString("pl-PL", {
												day: "numeric",
												month: "short",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
								) : scan.status === "failed" ? (
									<div className="flex flex-col gap-xs rounded-xl border border-danger/20 bg-danger-bg p-sm pr-lg min-w-[140px] max-w-[160px]">
										<div className="flex items-center gap-xs">
											<AlertTriangle className="size-3.5 text-danger" />
											<span className="text-sm font-medium text-danger">{t("scanFailed")}</span>
										</div>
										<span className="text-xs text-content-faint">
											{scan.createdAt.toLocaleString("pl-PL", {
												day: "numeric",
												month: "short",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
								) : (
									<button
										type="button"
										onClick={() =>
											loadScan({ scanId: scan.id, shopName: scan.shopName, items: scan.items })
										}
										className="flex flex-col gap-xs rounded-xl border border-edge-subtle bg-surface-raised p-sm pr-lg min-w-[140px] max-w-[160px] text-left active:scale-[0.98] transition-transform shadow-sm"
									>
										<span className="text-sm font-medium text-content truncate w-full">
											{scan.shopName ?? t("selectShop")}
										</span>
										<span className="text-xs text-content-faint">
											{t("items", { count: scan.items.length })}
										</span>
										<span className="text-xs text-content-faint">
											{scan.createdAt.toLocaleString("pl-PL", {
												day: "numeric",
												month: "short",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</button>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			<Sheet
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) closeSheet();
				}}
			>
				<SheetContent
					side="bottom"
					className="max-h-[90dvh] overflow-hidden flex flex-col gap-0 p-0"
				>
					<SheetHeader className="shrink-0 px-md pt-lg pb-md">
						<SheetTitle>{t("title")}</SheetTitle>
					</SheetHeader>

					{error ? (
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
						<div className="flex-1 overflow-y-auto px-md pb-lg pt-md">
							<div className="flex flex-col gap-md">
								<div className="flex flex-col gap-sm">
									<label className="text-xs font-medium text-content-muted">{t("shopLabel")}</label>

									{selectedShopId ? (
										<div className="flex items-center justify-between bg-surface-raised border border-edge-subtle rounded-xl p-md">
											<div className="flex items-center gap-xs">
												<Store size={16} className="text-content-muted" />
												<span className="text-sm font-medium text-content">
													{shops.find((s) => s.id === selectedShopId)?.name}
												</span>
											</div>
											<button
												type="button"
												onClick={() => {
													setSelectedShopId(null);
													setShopName("");
												}}
												className="text-xs text-brand-600"
											>
												{t("change")}
											</button>
										</div>
									) : (
										<>
											<Select
												value=""
												onValueChange={(val) => {
													setSelectedShopId(val || null);
													const shop = shops.find((s) => s.id === val);
													if (shop) setShopName(shop.name);
												}}
											>
												<SelectTrigger className="w-full bg-surface-sunken border-edge rounded-lg">
													<SelectValue>{t("selectShop")}</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{shops.map((shop) => (
														<SelectItem key={shop.id} value={shop.id}>
															{shop.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>

											<div className="flex items-center gap-md">
												<div className="flex-1 border-t border-edge-subtle" />
												<span className="text-xs font-semibold uppercase tracking-wide text-content-faint">
													lub
												</span>
												<div className="flex-1 border-t border-edge-subtle" />
											</div>

											<Button
												variant="outline"
												size="lg"
												className="w-full flex items-center justify-center gap-sm rounded-xl bg-surface-raised border-edge-subtle shadow-sm"
												onClick={() => setShopEditOpen(true)}
											>
												<Plus className="size-5 text-brand-600" />
												<span className="text-sm font-medium text-content">{t("addShop")}</span>
											</Button>
										</>
									)}
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
												onPriceChange={(price) => handlePriceChange(item._id, price)}
												onVerify={() => handleVerify(item._id)}
												onSkip={() => handleSkip(item._id)}
												onUnskip={() => handleUnskip(item._id)}
												onCreateNew={handleCreateSupplement}
											/>
										</div>
									))}
								</div>
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

			<AlertDialog
				open={deleteScanId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteScanId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteScanTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("deleteScanDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteScanId) deleteCartScan({ scanId: deleteScanId });
								setDeleteScanId(null);
							}}
						>
							{tCommon("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
