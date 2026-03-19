"use client";

import { useTranslations } from "next-intl";
import { deleteCartScan } from "@/features/shopping/api/actions/delete-cart-scan";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

type Props = {
	scanId: string | null;
	onClose: () => void;
};

export function DeleteScanDialog({ scanId, onClose }: Props) {
	const t = useTranslations("shopping.cartPriceSheet");
	const tCommon = useTranslations("common");

	return (
		<AlertDialog
			open={scanId !== null}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("deleteScanTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("deleteScanDescription")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (scanId) deleteCartScan({ scanId });
							onClose();
						}}
					>
						{tCommon("delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
