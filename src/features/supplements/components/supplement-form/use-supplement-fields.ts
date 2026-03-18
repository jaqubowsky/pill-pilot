"use client";

import { useFormContext } from "react-hook-form";
import type { SupplementFormValues } from "./supplement-form.schema";

export function useSupplementFields() {
	const {
		register,
		watch,
		setValue,
		formState: { errors },
	} = useFormContext<SupplementFormValues>();

	const category = watch("category");
	const stockUnit = watch("stockUnit");
	const currentStock = watch("currentStock");
	const packageSize = watch("packageSize");
	const packagePrice = watch("packagePrice");
	const shopId = watch("shopId");

	function handleCurrentStockChange(value: string) {
		setValue("currentStock", value ? Number(value) : undefined);
	}

	function handlePackageSizeChange(value: string) {
		setValue("packageSize", value ? Number(value) : undefined);
	}

	function handlePackagePriceChange(value: string) {
		setValue("packagePrice", value ? Number(value) : undefined);
	}

	function handleCategoryChange(value: SupplementFormValues["category"]) {
		setValue("category", value);
	}

	function handleStockUnitChange(value: SupplementFormValues["stockUnit"]) {
		setValue("stockUnit", value);
	}

	function handleShopChange(value: string | null) {
		setValue("shopId", value ?? undefined);
	}

	return {
		register,
		errors,
		category,
		stockUnit,
		currentStock,
		packageSize,
		packagePrice,
		shopId,
		handleCurrentStockChange,
		handlePackageSizeChange,
		handlePackagePriceChange,
		handleCategoryChange,
		handleStockUnitChange,
		handleShopChange,
	};
}
