"use client";

import { useTranslations } from "next-intl";
import { NumberInputDialog } from "@/shared/components/number-input-dialog";
import { useRestockDialog } from "./use-restock-dialog";

type RestockDialogProps = {
	supplementId: string;
	supplementName: string;
	stockUnit: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function RestockDialog({
	supplementId,
	supplementName,
	stockUnit,
	open,
	onOpenChange,
}: RestockDialogProps) {
	const t = useTranslations();

	const { amount, setAmount, inputRef, isPending, handleSubmit } = useRestockDialog({
		supplementId,
		open,
		onOpenChange,
	});

	const unitLabel = t(`schedule.units.${stockUnit}`);

	return (
		<NumberInputDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`${t("stock.restockTitle")}: ${supplementName}`}
			hint={t("stock.howManyBoughtUnit", { unit: unitLabel })}
			inputMin={1}
			placeholder="90"
			unitLabel={unitLabel}
			cancelLabel={t("common.cancel")}
			submitLabel={t("common.add")}
			isPending={isPending}
			value={amount}
			onValueChange={setAmount}
			onSubmit={handleSubmit}
			inputRef={inputRef}
		/>
	);
}
