"use client";

import { ArrowLeft, Calculator } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { useStockCalculator } from "./use-stock-calculator";

type StockCalculatorProps = {
	supplementId: string;
	packageSize: number | null;
	stockUnit: string;
	onApply: (remaining: number) => void;
};

export function StockCalculator({
	supplementId,
	packageSize,
	stockUnit,
	onApply,
}: StockCalculatorProps) {
	const t = useTranslations();
	const unitLabel = t(`schedule.units.${stockUnit}`);

	const {
		open,
		setOpen,
		size,
		setSize,
		startDate,
		setStartDate,
		result,
		isPending,
		canCalculate,
		handleBack,
		handleCalculate,
		handleApply,
	} = useStockCalculator({ supplementId, packageSize, onApply });

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex items-center gap-xs text-xs text-brand-600 hover:text-brand-700 transition-colors self-start"
			>
				<Calculator className="size-3 stroke-[1.5]" />
				{t("stock.calculatorTitle")}
			</button>
		);
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex items-center gap-xs text-xs text-brand-600 hover:text-brand-700 transition-colors self-start"
			>
				<Calculator className="size-3 stroke-[1.5]" />
				{t("stock.calculatorTitle")}
			</button>

			{createPortal(
				<div className="fixed inset-0 z-100 flex items-center justify-center">
					{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
					<div
						className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
						onMouseDown={() => setOpen(false)}
					/>
					<div className="relative z-10 w-full max-w-[calc(100%-2rem)] sm:max-w-sm rounded-2xl p-lg shadow-xl bg-surface-raised">
						<h2 className="text-base font-semibold text-content mb-md">
							{t("stock.calculatorTitle")}
						</h2>

						<div className={cn("flex flex-col gap-md", result && "hidden")}>
							<p className="text-sm text-content-faint">{t("stock.calculatorDescription")}</p>

							<div className="flex flex-col gap-xs">
								<label className="text-sm text-content-muted">
									{t("stock.calculatorPackageSize")}
								</label>
								<div className="flex items-center gap-sm">
									<Input
										type="number"
										min={1}
										value={size}
										onChange={(e) => setSize(e.target.value)}
										placeholder="100"
										className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base"
									/>
									<span className="text-sm text-content-muted shrink-0">{unitLabel}</span>
								</div>
							</div>

							<div className="flex flex-col gap-xs">
								<label className="text-sm text-content-muted">
									{t("stock.calculatorStartDate")}
								</label>
								<Input
									type="date"
									max={new Date().toISOString().split("T")[0]}
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="bg-surface-sunken border-edge rounded-lg px-md py-sm text-base"
								/>
							</div>

							<div className="flex gap-sm justify-end">
								<Button type="button" variant="ghost" onClick={() => setOpen(false)}>
									{t("common.cancel")}
								</Button>
								<Button
									type="button"
									onClick={handleCalculate}
									disabled={!canCalculate}
									className="bg-brand-500 text-content-inverse"
								>
									{isPending ? t("stock.calculatorCalculating") : t("stock.calculatorCalculate")}
								</Button>
							</div>
						</div>

						<div className={cn("flex flex-col gap-md", !result && "hidden")}>
							<div className="rounded-xl bg-surface-sunken p-md flex flex-col gap-sm">
								<div className="flex items-center justify-between">
									<span className="text-sm text-content-muted">
										{t("stock.calculatorConsumed")}
									</span>
									<span className="text-sm font-medium text-content">
										{result?.consumed} {unitLabel}
									</span>
								</div>
								<div className="h-px bg-edge-subtle" />
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-content">
										{t("stock.calculatorRemaining")}
									</span>
									<span className="text-sm font-bold text-brand-600">
										{result?.remaining} {unitLabel}
									</span>
								</div>
							</div>

							<div className="flex gap-sm">
								<Button type="button" variant="outline" onClick={handleBack} className="flex-1">
									<ArrowLeft className="size-4" />
									{t("common.back")}
								</Button>
								<Button
									type="button"
									onClick={handleApply}
									className="flex-1 bg-brand-500 text-content-inverse"
								>
									{t("stock.calculatorApply")}
								</Button>
							</div>
						</div>
					</div>
				</div>,
				document.body,
			)}
		</>
	);
}
