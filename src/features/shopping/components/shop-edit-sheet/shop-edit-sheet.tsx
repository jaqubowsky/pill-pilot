"use client";

import { useTranslations } from "next-intl";
import type { ShopOption } from "@/features/shopping/api/queries/get-price-list";
import { BottomSheet } from "@/shared/components/bottom-sheet";
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
import { Label } from "@/shared/components/ui/label";
import { useShopEditSheet } from "./use-shop-edit-sheet";

type ShopEditSheetProps = {
	shop: ShopOption | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ShopEditSheet({ shop, open, onOpenChange }: ShopEditSheetProps) {
	const t = useTranslations();

	const {
		isNew,
		isPending,
		values,
		setValues,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		handleSubmit,
		handleDeleteConfirm,
	} = useShopEditSheet({ shop, onOpenChange });

	return (
		<>
			<BottomSheet
				open={open}
				onOpenChange={onOpenChange}
				title={isNew ? t("shopping.addShop") : t("shopping.editShop")}
				scrollable
			>
				<form onSubmit={handleSubmit} className="flex flex-col gap-md">
					<div className="flex flex-col gap-xs">
						<Label htmlFor="shop-name">{t("shopping.shopName")}</Label>
						<Input
							id="shop-name"
							value={values.name}
							onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
							placeholder={t("shopping.shopNamePlaceholder")}
							required
						/>
					</div>

					<div className="flex flex-col gap-xs">
						<Label htmlFor="delivery-cost">{t("shopping.deliveryCost")}</Label>
						<div className="relative">
							<Input
								id="delivery-cost"
								type="number"
								inputMode="decimal"
								min={0}
								step={0.01}
								value={values.deliveryCost}
								onChange={(e) => setValues((prev) => ({ ...prev, deliveryCost: e.target.value }))}
								placeholder="0.00"
								className="pr-8"
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-content-muted pointer-events-none">
								zł
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-xs">
						<Label htmlFor="free-threshold">{t("shopping.freeDeliveryThreshold")}</Label>
						<div className="relative">
							<Input
								id="free-threshold"
								type="number"
								inputMode="decimal"
								min={0}
								step={0.01}
								value={values.freeDeliveryThreshold}
								onChange={(e) =>
									setValues((prev) => ({
										...prev,
										freeDeliveryThreshold: e.target.value,
									}))
								}
								placeholder="0.00"
								className="pr-8"
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-content-muted pointer-events-none">
								zł
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-sm mt-lg">
						<Button
							type="submit"
							disabled={isPending || !values.name.trim()}
							className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
						>
							{t("common.saveChanges")}
						</Button>

						{!isNew && (
							<Button
								type="button"
								variant="ghost"
								disabled={isPending}
								onClick={() => setDeleteConfirmOpen(true)}
								className="w-full text-danger"
							>
								{t("shopping.deleteShop")}
							</Button>
						)}
					</div>
				</form>
			</BottomSheet>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("shopping.deleteShopConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("shopping.deleteShopConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending}>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
