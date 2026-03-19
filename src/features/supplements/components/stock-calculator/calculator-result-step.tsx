"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";

type CalculatorResultStepProps = {
	consumed: number;
	remaining: number;
	unitLabel: string;
	onBack: () => void;
	onApply: () => void;
};

export function CalculatorResultStep({
	consumed,
	remaining,
	unitLabel,
	onBack,
	onApply,
}: CalculatorResultStepProps) {
	const t = useTranslations();

	return (
		<div className="flex flex-col gap-md">
			<div className="rounded-xl bg-surface-sunken p-md flex flex-col gap-sm">
				<div className="flex items-center justify-between">
					<span className="text-sm text-content-muted">{t("stock.calculatorConsumed")}</span>
					<span className="text-sm font-medium text-content">
						{consumed} {unitLabel}
					</span>
				</div>
				<div className="h-px bg-edge-subtle" />
				<div className="flex items-center justify-between">
					<span className="text-sm font-semibold text-content">
						{t("stock.calculatorRemaining")}
					</span>
					<span className="text-sm font-bold text-brand-600">
						{remaining} {unitLabel}
					</span>
				</div>
			</div>

			<div className="flex gap-sm">
				<Button type="button" variant="outline" onClick={onBack} className="flex-1">
					<ArrowLeft className="size-4" />
					{t("common.back")}
				</Button>
				<Button
					type="button"
					onClick={onApply}
					className="flex-1 bg-brand-500 text-content-inverse"
				>
					{t("stock.calculatorApply")}
				</Button>
			</div>
		</div>
	);
}
