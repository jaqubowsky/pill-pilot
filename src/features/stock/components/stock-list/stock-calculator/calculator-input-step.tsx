"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

type CalculatorInputStepProps = {
	size: string;
	onSizeChange: (value: string) => void;
	startDate: string;
	onStartDateChange: (value: string) => void;
	unitLabel: string;
	canCalculate: boolean;
	isPending: boolean;
	onCalculate: () => void;
	onCancel: () => void;
};

export function CalculatorInputStep({
	size,
	onSizeChange,
	startDate,
	onStartDateChange,
	unitLabel,
	canCalculate,
	isPending,
	onCalculate,
	onCancel,
}: CalculatorInputStepProps) {
	const t = useTranslations();

	return (
		<div className="flex flex-col gap-md">
			<p className="text-sm text-content-faint">{t("stock.calculatorDescription")}</p>

			<div className="flex flex-col gap-xs">
				<label className="text-sm text-content-muted">{t("stock.calculatorPackageSize")}</label>
				<div className="flex items-center gap-sm">
					<Input
						type="number"
						min={1}
						value={size}
						onChange={(e) => onSizeChange(e.target.value)}
						placeholder="100"
						className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base"
					/>
					<span className="text-sm text-content-muted shrink-0">{unitLabel}</span>
				</div>
			</div>

			<div className="flex flex-col gap-xs">
				<label className="text-sm text-content-muted">{t("stock.calculatorStartDate")}</label>
				<Input
					type="date"
					max={new Date().toISOString().split("T")[0]}
					value={startDate}
					onChange={(e) => onStartDateChange(e.target.value)}
					className="bg-surface-sunken border-edge rounded-lg px-md py-sm text-base"
				/>
			</div>

			<div className="flex gap-sm justify-end">
				<Button type="button" variant="ghost" onClick={onCancel}>
					{t("common.cancel")}
				</Button>
				<Button
					type="button"
					onClick={onCalculate}
					disabled={!canCalculate}
					className="bg-brand-500 text-content-inverse"
				>
					{isPending ? t("stock.calculatorCalculating") : t("stock.calculatorCalculate")}
				</Button>
			</div>
		</div>
	);
}
