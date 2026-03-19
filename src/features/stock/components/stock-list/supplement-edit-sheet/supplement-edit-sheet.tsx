"use client";

import { useTranslations } from "next-intl";
import type { StockListItem } from "@/features/stock/api/queries/get-stock-list";
import { SupplementForm } from "@/features/supplements";
import { BottomSheet } from "@/shared/components/bottom-sheet";
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
import { Button } from "@/shared/components/ui/button";
import type { ShopOption } from "@/shared/types";
import { useSupplementEditSheet } from "./use-supplement-edit-sheet";

type SupplementEditSheetProps = {
	supplement: StockListItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	shops?: ShopOption[];
};

const FORM_ID = "supplement-edit-form";

export function SupplementEditSheet({
	supplement,
	open,
	onOpenChange,
	shops,
}: SupplementEditSheetProps) {
	const t = useTranslations();

	const {
		isNew,
		isPending,
		handleSubmit,
		handleDeleteConfirm,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		defaultValues,
	} = useSupplementEditSheet({
		supplement,
		onOpenChange,
	});

	return (
		<>
			<BottomSheet
				open={open}
				onOpenChange={onOpenChange}
				title={isNew ? t("supplement.addTitle") : t("supplement.editTitle")}
				scrollable
			>
				<SupplementForm
					key={supplement?.id ?? "new"}
					defaultValues={defaultValues}
					onSubmit={handleSubmit}
					formId={FORM_ID}
					supplementId={supplement?.id}
					shops={shops}
				/>

				<div className="flex flex-col gap-sm mt-lg">
					<Button
						type="submit"
						form={FORM_ID}
						variant="default"
						disabled={isPending}
						className="w-full bg-brand-500 text-content-inverse rounded-lg px-lg py-sm text-sm font-medium"
					>
						{t("common.saveChanges")}
					</Button>

					{!isNew && (
						<Button
							type="button"
							variant="ghost"
							disabled={isPending}
							onClick={() => setDeleteConfirmOpen(true)}
							className="w-full text-danger"
						>
							{t("supplement.delete")}
						</Button>
					)}
				</div>
			</BottomSheet>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("supplement.deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("supplement.deleteConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending}>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
