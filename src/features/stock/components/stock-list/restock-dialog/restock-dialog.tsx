"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { RestockForm } from "./restock-form";

type Props = {
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
}: Props) {
	const t = useTranslations("stock");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="rounded-2xl p-lg shadow-xl bg-surface-raised"
			>
				<DialogHeader>
					<DialogTitle className="text-base font-semibold text-content">
						{`${t("restockTitle")}: ${supplementName}`}
					</DialogTitle>
				</DialogHeader>
				{open && (
					<RestockForm
						supplementId={supplementId}
						stockUnit={stockUnit}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
