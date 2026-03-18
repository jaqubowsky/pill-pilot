"use client";

import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";

type CalculatorTriggerProps = {
	onClick: () => void;
};

export function CalculatorTrigger({ onClick }: CalculatorTriggerProps) {
	const t = useTranslations("stock");

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-xs text-xs text-brand-600 hover:text-brand-700 transition-colors self-start"
		>
			<Calculator className="size-3 stroke-[1.5]" />
			{t("calculatorTitle")}
		</button>
	);
}
