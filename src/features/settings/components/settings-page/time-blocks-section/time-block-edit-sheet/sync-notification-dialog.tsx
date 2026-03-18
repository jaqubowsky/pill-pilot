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

type SyncNotificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	startTime: string;
	onConfirm: (sync: boolean) => void;
};

export function SyncNotificationDialog({
	open,
	onOpenChange,
	startTime,
	onConfirm,
}: SyncNotificationDialogProps) {
	const t = useTranslations();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("timeBlock.syncNotificationTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("timeBlock.syncNotificationDescription", { time: startTime })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onConfirm(false)}>
						{t("timeBlock.syncNotificationDecline")}
					</AlertDialogCancel>
					<AlertDialogAction onClick={() => onConfirm(true)}>
						{t("timeBlock.syncNotificationAccept")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
