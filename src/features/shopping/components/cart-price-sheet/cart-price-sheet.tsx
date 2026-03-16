"use client";

import { AlertTriangle, CheckCircle, Loader2, ShoppingCart, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
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
import type { ShopOption, SupplementOption } from "./use-cart-price-sheet";
import { useCartPriceSheet } from "./use-cart-price-sheet";

type CartPriceSheetProps = {
	supplements: SupplementOption[];
	shops: ShopOption[];
	onSaved?: () => void;
	trigger?: React.ReactNode;
};

export function CartPriceSheet({ supplements, shops, onSaved, trigger }: CartPriceSheetProps) {
	const t = useTranslations("shopping.cartPriceSheet");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		isOpen,
		isUploading,
		isSaving,
		error,
		items,
		shopName,
		setShopName,
		selectedShopId,
		setSelectedShopId,
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
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="sr-only"
				onChange={handleFileChange}
			/>

			{trigger ? (
				<div
					role="button"
					tabIndex={0}
					onClick={handleTriggerClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") handleTriggerClick();
					}}
					className="contents"
				>
					{trigger}
				</div>
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
				<SheetContent side="bottom" className="max-h-[90dvh] overflow-hidden flex flex-col">
					<SheetHeader>
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
						<div className="flex flex-col gap-md overflow-y-auto flex-1 px-4 pb-2">
							<div className="flex flex-col gap-xs">
								<label className="text-xs font-medium text-content-muted">{t("shopLabel")}</label>
								<div className="flex gap-xs">
									<Input
										value={shopName}
										onChange={(e) => {
											setShopName(e.target.value);
											setSelectedShopId(null);
										}}
										placeholder={t("shopPlaceholder")}
										className="flex-1"
									/>
									{shops.length > 0 && (
										<Select
											value={selectedShopId ?? ""}
											onValueChange={(val) => {
												setSelectedShopId(val || null);
												const shop = shops.find((s) => s.id === val);
												if (shop) setShopName(shop.name);
											}}
										>
											<SelectTrigger className="w-40">
												<SelectValue placeholder={t("selectShop")} />
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
								</div>
							</div>

							{unverifiedCount > 0 && (
								<div className="rounded-xl bg-warning-bg border border-warning/20 p-md">
									<p className="text-sm text-[#8B6914]">
										{t("requiresVerification", { count: unverifiedCount })}
									</p>
								</div>
							)}

							<div className="flex flex-col gap-sm">
								{items.map((item) => {
									const isHighConfidence =
										item.matchedSupplementId !== null &&
										item.matchedSupplementId !== undefined &&
										item.confidence >= CART_CONFIDENCE_THRESHOLD;
									const isLowConfidence =
										item.matchedSupplementId !== null &&
										item.matchedSupplementId !== undefined &&
										item.confidence < CART_CONFIDENCE_THRESHOLD;
									const isUnmatched = !item.matchedSupplementId;

									return (
										<div
											key={item._id}
											className="rounded-xl border border-border p-md flex flex-col gap-sm"
										>
											<div className="flex items-start justify-between gap-sm">
												<div className="flex flex-col gap-xs flex-1 min-w-0">
													<p className="text-sm font-medium text-content truncate">
														{item.productName}
													</p>
													<p className="text-xs text-content-muted">
														{item.price.toFixed(2)} zł
														{item.quantity && item.quantity > 1 && <span> × {item.quantity}</span>}
													</p>
												</div>

												<div className="flex items-center gap-xs shrink-0">
													{item.skipped ? (
														<button
															type="button"
															onClick={() => handleUnskip(item._id)}
															className="text-xs text-content-muted underline"
														>
															{t("unskip")}
														</button>
													) : isHighConfidence && item.verified ? (
														<CheckCircle className="size-4 text-success shrink-0" />
													) : isLowConfidence && !item.verified ? (
														<div className="flex items-center gap-xs">
															<AlertTriangle className="size-3.5 text-[#8B6914] shrink-0" />
															<span className="text-xs text-[#8B6914]">{t("verify")}</span>
														</div>
													) : isUnmatched ? (
														<div className="flex items-center gap-xs">
															<XCircle className="size-3.5 text-destructive shrink-0" />
															<span className="text-xs text-destructive">{t("unmatched")}</span>
														</div>
													) : null}
												</div>
											</div>

											<div className="flex gap-xs">
												<Select
													value={item.matchedSupplementId ?? ""}
													onValueChange={(val) => handleMatchChange(item._id, val || null)}
												>
													<SelectTrigger className="flex-1 text-xs" size="sm">
														<SelectValue placeholder={t("selectSupplement")} />
													</SelectTrigger>
													<SelectContent>
														{supplements.map((s) => (
															<SelectItem key={s.id} value={s.id}>
																{s.name}
																{s.brandName && (
																	<span className="text-content-muted"> · {s.brandName}</span>
																)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>

												{!item.skipped && !item.verified && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleVerify(item._id)}
														disabled={!item.matchedSupplementId}
													>
														{t("ok")}
													</Button>
												)}

												{!item.skipped && (
													<Button variant="ghost" size="sm" onClick={() => handleSkip(item._id)}>
														{t("skip")}
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					<SheetFooter>
						<Button onClick={handleSave} disabled={!canSave || isSaving} className="w-full">
							{isSaving ? t("saving") : t("savePrices")}
						</Button>
						<Button variant="outline" onClick={closeSheet} className="w-full">
							{t("cancel")}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</>
	);
}
