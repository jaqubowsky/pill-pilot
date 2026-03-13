"use client";

import { useTranslations } from "next-intl";
import { NumberInputDialog } from "@/shared/components/number-input-dialog";
import { useAdjustDialog } from "./use-adjust-dialog";

type AdjustDialogProps = {
	supplementId: string;
	supplementName: string;
	currentStock: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AdjustDialog({
	supplementId,
	supplementName,
	currentStock,
	open,
	onOpenChange,
}: AdjustDialogProps) {
	const t = useTranslations();

	const { value, setValue, inputRef, isPending, handleSubmit } = useAdjustDialog({
		supplementId,
		currentStock,
		open,
		onOpenChange,
	});

	return (
		<NumberInputDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`${t("stock.adjustTitle")}: ${supplementName}`}
			hint={t("stock.howManyLeft")}
			inputMin={0}
			placeholder="0"
			cancelLabel={t("common.cancel")}
			submitLabel={t("common.save")}
			isPending={isPending}
			value={value}
			onValueChange={setValue}
			onSubmit={handleSubmit}
			inputRef={inputRef}
		/>
	);
}
