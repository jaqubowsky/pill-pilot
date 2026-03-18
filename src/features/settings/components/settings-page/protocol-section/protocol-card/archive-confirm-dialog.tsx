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

type ArchiveConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	disabled: boolean;
};

export function ArchiveConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	disabled,
}: ArchiveConfirmDialogProps) {
	const t = useTranslations();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("settings.archiveConfirmTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("settings.archiveConfirmDescription")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={disabled}>
						{t("common.archive")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
