"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { calculateRemainingStock } from "../../api/actions/calculate-remaining-stock";
import { toDateString } from "@/shared/lib/date";

type UseStockCalculatorParams = {
	supplementId: string;
	packageSize: number | null;
	onApply: (remaining: number) => void;
};

export function useStockCalculator({
	supplementId,
	packageSize,
	onApply,
}: UseStockCalculatorParams) {
	const t = useTranslations("stock");
	const [open, setOpen] = useState(false);
	const [size, setSize] = useState("");
	const [startDate, setStartDate] = useState("");
	const [result, setResult] = useState<{ consumed: number; remaining: number } | null>(null);
	const [isPending, setIsPending] = useState(false);

	function handleOpen(next: boolean) {
		setOpen(next);
		if (next) {
			setSize(packageSize?.toString() ?? "");
			setStartDate("");
			setResult(null);
		}
	}

	function getDaysAgo(): number {
		if (!startDate) return 0;
		const start = new Date(startDate).getTime();
		const now = new Date(toDateString(new Date())).getTime();
		return Math.max(0, Math.round((now - start) / 86_400_000));
	}

	async function handleCalculate() {
		const parsedSize = parseFloat(size);
		const daysAgo = getDaysAgo();
		if (Number.isNaN(parsedSize) || parsedSize <= 0) return;
		if (daysAgo < 1) return;

		setIsPending(true);
		try {
			const res = await calculateRemainingStock({
				supplementId,
				packageSize: parsedSize,
				daysAgo,
			});
			if (res?.data) {
				setResult(res.data);
			} else if (res?.serverError) {
				toast.error(res.serverError);
			}
		} catch {
			toast.error(t("calculatorError"));
		} finally {
			setIsPending(false);
		}
	}

	function handleApply() {
		if (result === null) return;
		onApply(result.remaining);
		setOpen(false);
	}

	function handleBack() {
		setResult(null);
	}

	const canCalculate = !isPending && size !== "" && parseFloat(size) > 0 && getDaysAgo() >= 1;

	return {
		open,
		setOpen: handleOpen,
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
	};
}
