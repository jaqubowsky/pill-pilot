"use client";

import { useTranslations } from "next-intl";
import { Controller, FormProvider } from "react-hook-form";
import type { ShopWithDelivery } from "@/shared/api/queries/get-price-list";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { CurrencyField } from "./currency-field";
import { DeleteShopDialog } from "./delete-shop-dialog";
import { useShopEditSheet } from "./use-shop-edit-sheet";

type ShopEditSheetProps = {
	shop: ShopWithDelivery | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ShopEditSheet({ shop, open, onOpenChange }: ShopEditSheetProps) {
	const t = useTranslations();

	const {
		methods,
		isNew,
		isPending,
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
				<FormProvider {...methods}>
					<form onSubmit={handleSubmit} className="flex flex-col gap-md">
						<Controller
							name="name"
							control={methods.control}
							render={({ field }) => (
								<div className="flex flex-col gap-xs">
									<Label htmlFor="shop-name">{t("shopping.shopName")}</Label>
									<Input
										id="shop-name"
										value={field.value}
										onChange={field.onChange}
										placeholder={t("shopping.shopNamePlaceholder")}
										required
									/>
								</div>
							)}
						/>

						<Controller
							name="deliveryCost"
							control={methods.control}
							render={({ field }) => (
								<CurrencyField
									id="delivery-cost"
									label={t("shopping.deliveryCost")}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>

						<Controller
							name="freeDeliveryThreshold"
							control={methods.control}
							render={({ field }) => (
								<CurrencyField
									id="free-threshold"
									label={t("shopping.freeDeliveryThreshold")}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>

						<div className="flex flex-col gap-sm mt-lg">
							<Button
								type="submit"
								disabled={isPending || !methods.formState.isValid}
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
				</FormProvider>
			</BottomSheet>

			<DeleteShopDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				onConfirm={handleDeleteConfirm}
				disabled={isPending}
			/>
		</>
	);
}
