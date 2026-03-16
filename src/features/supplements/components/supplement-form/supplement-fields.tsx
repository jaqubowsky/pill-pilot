"use client";

import { useTranslations } from "next-intl";
import { StockCalculator } from "@/features/stock/components/stock-list/stock-calculator";
import { InfoHint } from "@/shared/components/info-hint";
import { LabeledInput } from "@/shared/components/labeled-input";
import { LabeledSelect } from "@/shared/components/labeled-select";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { DOSAGE_UNITS, SUPPLEMENT_CATEGORIES } from "@/shared/db/schema";
import { useSupplementFields } from "./use-supplement-fields";

type SupplementFieldsProps = {
	supplementId?: string;
};

export function SupplementFields({ supplementId }: SupplementFieldsProps) {
	const t = useTranslations();
	const {
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
	} = useSupplementFields();

	const unitLabel = stockUnit ? t(`schedule.units.${stockUnit}`) : "";

	return (
		<div className="flex flex-col gap-md">
			<LabeledInput
				label={t("supplement.name")}
				{...register("name")}
				placeholder={t("supplement.name")}
				error={errors.name?.message}
			/>

			<LabeledInput
				label={t("supplement.brand")}
				{...register("brandName")}
				placeholder={t("supplement.brand")}
			/>

			<LabeledSelect
				label={t("supplement.category")}
				value={category}
				onValueChange={handleCategoryChange}
				displayValue={category ? t(`supplement.categories.${category}`) : t("supplement.category")}
			>
				{SUPPLEMENT_CATEGORIES.map((cat) => (
					<SelectItem key={cat} value={cat}>
						{t(`supplement.categories.${cat}`)}
					</SelectItem>
				))}
			</LabeledSelect>

			<div className="flex flex-col gap-xs">
				<Label className="text-sm text-content-muted flex items-center gap-xs">
					{t("supplement.packageSize")}
					<InfoHint text={t("supplement.packageSizeHint")} />
				</Label>
				<div className="flex items-center gap-sm">
					<Input
						type="number"
						min={1}
						className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
						placeholder="90"
						value={packageSize ?? ""}
						onChange={(e) => handlePackageSizeChange(e.target.value)}
					/>
					<Select value={stockUnit} onValueChange={handleStockUnitChange}>
						<SelectTrigger className="w-auto shrink-0 bg-surface-sunken border-edge rounded-lg">
							<SelectValue>{unitLabel}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{DOSAGE_UNITS.map((unit) => (
								<SelectItem key={unit} value={unit}>
									{t(`schedule.units.${unit}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex flex-col gap-xs">
				<Label className="text-sm text-content-muted flex items-center gap-xs">
					{t("supplement.currentStock")}
					<InfoHint text={t("supplement.currentStockHint")} />
				</Label>
				<div className="flex items-center gap-sm">
					<Input
						type="number"
						min={0}
						className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
						placeholder="0"
						value={currentStock ?? ""}
						onChange={(e) => handleCurrentStockChange(e.target.value)}
					/>
					<span className="text-sm text-content-muted shrink-0">{unitLabel}</span>
				</div>
				{supplementId && (
					<StockCalculator
						supplementId={supplementId}
						packageSize={packageSize ?? null}
						stockUnit={stockUnit}
						onApply={(remaining) => handleCurrentStockChange(String(remaining))}
					/>
				)}
			</div>

			<div className="flex flex-col gap-xs">
				<Label className="text-sm text-content-muted flex items-center gap-xs">
					{t("supplement.packagePrice")}
					<InfoHint text={t("supplement.packagePriceHint")} />
				</Label>
				<Input
					type="number"
					min={0}
					step={0.01}
					className="bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
					placeholder="49.99"
					value={packagePrice ?? ""}
					onChange={(e) => handlePackagePriceChange(e.target.value)}
				/>
			</div>
		</div>
	);
}
