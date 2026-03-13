"use client";

import { useTranslations } from "next-intl";
import { NumberInputDialog } from "@/shared/components/number-input-dialog";
import { useRestockDialog } from "./use-restock-dialog";

type RestockDialogProps = {
	supplementId: string;
	supplementName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function RestockDialog({
	supplementId,
	supplementName,
	open,
	onOpenChange,
}: RestockDialogProps) {
	const t = useTranslations();

	const { amount, setAmount, inputRef, isPending, handleSubmit } = useRestockDialog({
		supplementId,
		open,
		onOpenChange,
	});

	return (
		<NumberInputDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`${t("stock.restockTitle")}: ${supplementName}`}
			hint={t("stock.howManyBought")}
			inputMin={1}
			placeholder="90"
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
