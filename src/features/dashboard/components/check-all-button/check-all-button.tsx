"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useCheckAll } from "./use-check-all";

type Props = {
	scheduleIds: string[];
	uncheckedIds: string[];
	date: string;
};

export function CheckAllButton({ scheduleIds, uncheckedIds, date }: Props) {
	const t = useTranslations("dashboard");
	const { confirmOpen, isPending, openConfirm, closeConfirm, handleConfirm } = useCheckAll({
		scheduleIds,
		date,
	});

	if (uncheckedIds.length === 0) return null;

	return (
		<>
			<Button
				variant="ghost"
				className="mt-sm w-full text-brand-600"
				onClick={openConfirm}
				disabled={isPending}
			>
				<CheckIcon className="size-4" />
				{t("checkOffBlock")}
			</Button>

			<Dialog open={confirmOpen} onOpenChange={closeConfirm}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>{t("checkAllTitle")}</DialogTitle>
						<DialogDescription>
							{t("checkAllDescription", { count: uncheckedIds.length })}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={closeConfirm}>
							{t("uncheckCancel")}
						</Button>
						<Button onClick={handleConfirm}>{t("checkAllConfirm")}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
