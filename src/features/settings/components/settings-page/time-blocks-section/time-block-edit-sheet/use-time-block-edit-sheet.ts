"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { addTimeBlock } from "@/features/settings/api/actions/add-time-block";
import { deleteTimeBlock } from "@/features/settings/api/actions/delete-time-block";
import { updateTimeBlock } from "@/features/settings/api/actions/update-time-block";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";

type UseTimeBlockEditSheetParams = {
	timeBlock?: UserTimeBlock;
	hasNotification: boolean;
	onOpenChange: (open: boolean) => void;
};

export function useTimeBlockEditSheet({
	timeBlock,
	hasNotification,
	onOpenChange,
}: UseTimeBlockEditSheetParams) {
	const t = useTranslations();
	const isNew = !timeBlock;

	const [name, setName] = useState(timeBlock?.name ?? "");
	const [icon, setIcon] = useState(timeBlock?.icon ?? "Sunrise");
	const [startTime, setStartTime] = useState(timeBlock?.startTime ?? "");
	const [syncDialogOpen, setSyncDialogOpen] = useState(false);

	const { execute: execUpdate, isPending: isUpdating } = useAction(updateTimeBlock, {
		onSuccess: () => {
			toast.success(t("common.saveChanges"));
			onOpenChange(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: execAdd, isPending: isAdding } = useAction(addTimeBlock, {
		onSuccess: () => {
			toast.success(t("common.saveChanges"));
			onOpenChange(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: execDelete, isPending: isDeleting } = useAction(deleteTimeBlock, {
		onSuccess: () => {
			toast.success(t("timeBlock.deleteBlock"));
			onOpenChange(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const timeChanged = !isNew && startTime !== timeBlock.startTime;

	function handleSave() {
		if (!name.trim() || !icon || !startTime) return;

		if (isNew) {
			execAdd({ name: name.trim(), icon, startTime });
		} else if (timeChanged && hasNotification) {
			setSyncDialogOpen(true);
		} else {
			execUpdate({ timeBlockId: timeBlock.id, name: name.trim(), icon, startTime });
		}
	}

	function handleSyncConfirm(syncNotification: boolean) {
		if (!timeBlock) return;
		setSyncDialogOpen(false);
		execUpdate({
			timeBlockId: timeBlock.id,
			name: name.trim(),
			icon,
			startTime,
			syncNotification,
		});
	}

	function handleDelete() {
		if (!timeBlock) return;
		execDelete({ timeBlockId: timeBlock.id });
	}

	const isPending = isUpdating || isAdding || isDeleting;

	return {
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
		syncDialogOpen,
		setSyncDialogOpen,
		handleSyncConfirm,
	};
}
