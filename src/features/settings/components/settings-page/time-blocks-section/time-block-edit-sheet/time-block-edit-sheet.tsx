"use client";

import { useTranslations } from "next-intl";
import { Controller, FormProvider } from "react-hook-form";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { IconPicker } from "../icon-picker";
import { SyncNotificationDialog } from "./sync-notification-dialog";
import { useTimeBlockEditSheet } from "./use-time-block-edit-sheet";

type TimeBlockEditSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	timeBlock?: UserTimeBlock;
	hasNotification?: boolean;
};

export function TimeBlockEditSheet({
	open,
	onOpenChange,
	timeBlock,
	hasNotification = false,
}: TimeBlockEditSheetProps) {
	const t = useTranslations();
	const {
		methods,
		isNew,
		isPending,
		handleSave,
		handleDelete,
		syncDialogOpen,
		setSyncDialogOpen,
		handleSyncConfirm,
	} = useTimeBlockEditSheet({ timeBlock, hasNotification, onOpenChange });

	return (
		<>
			<BottomSheet
				open={open}
				onOpenChange={onOpenChange}
				title={isNew ? t("timeBlock.addTitle") : t("timeBlock.editTitle")}
			>
				<FormProvider {...methods}>
					<form onSubmit={handleSave} className="flex flex-col gap-md">
						<Controller
							name="name"
							control={methods.control}
							render={({ field }) => (
								<LabeledInput
									label={t("timeBlock.name")}
									value={field.value}
									onChange={field.onChange}
									placeholder={t("timeBlock.name")}
								/>
							)}
						/>

						<Controller
							name="icon"
							control={methods.control}
							render={({ field }) => (
								<div className="flex flex-col gap-xs">
									<Label className="text-sm text-content-muted">{t("timeBlock.icon")}</Label>
									<IconPicker value={field.value} onValueChange={field.onChange} />
								</div>
							)}
						/>

						<Controller
							name="startTime"
							control={methods.control}
							render={({ field }) => (
								<LabeledInput
									label={t("timeBlock.startTime")}
									type="time"
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>

						<Button
							type="submit"
							className="w-full mt-sm"
							disabled={isPending || !methods.formState.isValid}
						>
							{t("common.saveChanges")}
						</Button>

						{!isNew && (
							<Button
								type="button"
								variant="destructive"
								className="w-full"
								onClick={handleDelete}
								disabled={isPending}
							>
								{t("timeBlock.deleteBlock")}
							</Button>
						)}
					</form>
				</FormProvider>
			</BottomSheet>

			<SyncNotificationDialog
				open={syncDialogOpen}
				onOpenChange={setSyncDialogOpen}
				startTime={methods.watch("startTime")}
				onConfirm={handleSyncConfirm}
			/>
		</>
	);
}
