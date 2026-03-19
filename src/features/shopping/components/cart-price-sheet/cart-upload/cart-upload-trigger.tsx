"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import type { SupplementOption } from "../use-cart-price-sheet";
import { useCartUpload } from "./use-cart-upload";

type Props = {
	supplements: SupplementOption[];
	trigger?: React.ReactNode;
};

export function CartUploadTrigger({ supplements, trigger }: Props) {
	const t = useTranslations("shopping.cartPriceSheet");
	const { fileInputRef, handleFileChange, openFilePicker } = useCartUpload(supplements);

	return (
		<>
			<input
				id="cart-file-input"
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="sr-only"
				onChange={handleFileChange}
			/>

			{trigger ? (
				<label htmlFor="cart-file-input" className="contents cursor-pointer">
					{trigger}
				</label>
			) : (
				<Button variant="outline" onClick={openFilePicker} className="gap-xs">
					<ShoppingCart className="size-4" />
					{t("scanCart")}
				</Button>
			)}
		</>
	);
}
