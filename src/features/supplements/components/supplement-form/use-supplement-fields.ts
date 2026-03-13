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

	function handleCurrentStockChange(value: string) {
		setValue("currentStock", value ? Number(value) : undefined);
	}

	function handlePackageSizeChange(value: string) {
		setValue("packageSize", value ? Number(value) : undefined);
	}

	function handlePackagePriceChange(value: string) {
		setValue("packagePrice", value ? Number(value) : undefined);
	}

	function handleCategoryChange(value: string | null) {
		if (value) setValue("category", value as SupplementFormValues["category"]);
	}

	function handleStockUnitChange(value: string | null) {
		if (value) setValue("stockUnit", value as SupplementFormValues["stockUnit"]);
	}

	return {
		register,
		errors,
		category,
		stockUnit,
		currentStock,
		packageSize,
		packagePrice,
		handleCurrentStockChange,
		handlePackageSizeChange,
		handlePackagePriceChange,
		handleCategoryChange,
		handleStockUnitChange,
	};
}
