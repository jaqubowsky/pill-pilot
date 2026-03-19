"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import type { SupplementOption } from "../use-cart-price-sheet";

export function useCartUpload(supplements: SupplementOption[]) {
	const t = useTranslations("shopping.cartPriceSheet");
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function uploadFile(file: File) {
		const formData = new FormData();
		formData.append("file", file);
		formData.append(
			"supplements",
			JSON.stringify(supplements.map((s) => ({ id: s.id, name: s.name, brandName: s.brandName }))),
		);

		try {
			const response = await fetch("/api/cart/parse", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				toast.error(t("uploadError"));
			}
		} catch {
			toast.error(t("uploadError"));
		}
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) uploadFile(file);
		e.target.value = "";
	}

	function openFilePicker() {
		fileInputRef.current?.click();
	}

	return { fileInputRef, handleFileChange, openFilePicker };
}
