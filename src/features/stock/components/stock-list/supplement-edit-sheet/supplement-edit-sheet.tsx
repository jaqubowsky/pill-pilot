"use client";

import { useTranslations } from "next-intl";
import type { StockListItem } from "@/features/stock/api/queries/get-stock-list";
import { SupplementForm } from "@/features/supplements";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { useSupplementEditSheet } from "./use-supplement-edit-sheet";

type SupplementEditSheetProps = {
	supplement: StockListItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const FORM_ID = "supplement-edit-form";

export function SupplementEditSheet({ supplement, open, onOpenChange }: SupplementEditSheetProps) {
	const t = useTranslations();

	const { isNew, isPending, handleSubmit, handleDelete, defaultValues } = useSupplementEditSheet({
		supplement,
		onOpenChange,
	});

	return (
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
						onClick={handleDelete}
						className="w-full text-danger"
					>
						{t("supplement.delete")}
					</Button>
				)}
			</div>
		</BottomSheet>
	);
}
