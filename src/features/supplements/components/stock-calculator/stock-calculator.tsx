"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { CalculatorInputStep } from "./calculator-input-step";
import { CalculatorResultStep } from "./calculator-result-step";
import { CalculatorTrigger } from "./calculator-trigger";
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

	return (
		<>
			<CalculatorTrigger onClick={() => setOpen(true)} />

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t("stock.calculatorTitle")}</DialogTitle>
					</DialogHeader>

					{result ? (
						<CalculatorResultStep
							consumed={result.consumed}
							remaining={result.remaining}
							unitLabel={unitLabel}
							onBack={handleBack}
							onApply={handleApply}
						/>
					) : (
						<CalculatorInputStep
							size={size}
							onSizeChange={setSize}
							startDate={startDate}
							onStartDateChange={setStartDate}
							unitLabel={unitLabel}
							canCalculate={canCalculate}
							isPending={isPending}
							onCalculate={handleCalculate}
							onCancel={() => setOpen(false)}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
