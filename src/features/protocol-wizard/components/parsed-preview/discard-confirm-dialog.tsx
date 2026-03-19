"use client";

import { useTranslations } from "next-intl";
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

type DiscardConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isDiscarding: boolean;
};

export function DiscardConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	isDiscarding,
}: DiscardConfirmDialogProps) {
	const t = useTranslations();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("protocolWizard.discardConfirmTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("protocolWizard.discardConfirmDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isDiscarding}>
						{t("protocolWizard.discardDraft")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
