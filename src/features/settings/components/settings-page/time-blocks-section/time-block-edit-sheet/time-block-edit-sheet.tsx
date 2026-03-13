"use client";

import { useTranslations } from "next-intl";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { BottomSheet } from "@/shared/components/bottom-sheet";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { IconPicker } from "../icon-picker";
import { useTimeBlockEditSheet } from "./use-time-block-edit-sheet";

type TimeBlockEditSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	timeBlock?: UserTimeBlock;
};

export function TimeBlockEditSheet({ open, onOpenChange, timeBlock }: TimeBlockEditSheetProps) {
	const t = useTranslations();
	const {
		isNew,
		name,
		setName,
		icon,
		setIcon,
		startTime,
		setStartTime,
		isPending,
		handleSave,
		handleDelete,
	} = useTimeBlockEditSheet({ timeBlock, onOpenChange });

	return (
		<BottomSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isNew ? t("timeBlock.addTitle") : t("timeBlock.editTitle")}
		>
			<div className="flex flex-col gap-md">
				<LabeledInput
					label={t("timeBlock.name")}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("timeBlock.name")}
				/>

				<div className="flex flex-col gap-xs">
					<Label className="text-sm text-content-muted">{t("timeBlock.icon")}</Label>
					<IconPicker value={icon} onValueChange={setIcon} />
				</div>

				<LabeledInput
					label={t("timeBlock.startTime")}
					type="time"
					value={startTime}
					onChange={(e) => setStartTime(e.target.value)}
				/>

				<Button
					className="w-full mt-sm"
					onClick={handleSave}
					disabled={isPending || !name.trim() || !startTime}
				>
					{t("common.saveChanges")}
				</Button>

				{!isNew && (
					<Button
						variant="destructive"
						className="w-full"
						onClick={handleDelete}
						disabled={isPending}
					>
						{t("timeBlock.deleteBlock")}
					</Button>
				)}
			</div>
		</BottomSheet>
	);
}
