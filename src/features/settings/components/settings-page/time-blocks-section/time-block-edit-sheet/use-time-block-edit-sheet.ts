"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { addTimeBlock } from "@/features/settings/api/actions/add-time-block";
import { deleteTimeBlock } from "@/features/settings/api/actions/delete-time-block";
import { updateTimeBlock } from "@/features/settings/api/actions/update-time-block";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { type TimeBlockFormValues, timeBlockFormSchema } from "./time-block-edit-sheet.schema";

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

	const methods = useForm<TimeBlockFormValues>({
		resolver: zodResolver(timeBlockFormSchema),
		defaultValues: {
			name: timeBlock?.name ?? "",
			icon: timeBlock?.icon ?? "Sunrise",
			startTime: timeBlock?.startTime ?? "",
		},
	});

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

	const handleSave = methods.handleSubmit((values) => {
		if (isNew) {
			execAdd(values);
			return;
		}

		const timeChanged = values.startTime !== timeBlock.startTime;
		if (timeChanged && hasNotification) {
			setSyncDialogOpen(true);
			return;
		}

		execUpdate({ timeBlockId: timeBlock.id, ...values });
	});

	function handleSyncConfirm(syncNotification: boolean) {
		if (!timeBlock) return;
		setSyncDialogOpen(false);
		const values = methods.getValues();
		execUpdate({ timeBlockId: timeBlock.id, ...values, syncNotification });
	}

	function handleDelete() {
		if (!timeBlock) return;
		execDelete({ timeBlockId: timeBlock.id });
	}

	const isPending = isUpdating || isAdding || isDeleting;

	return {
		methods,
		isNew,
		isPending,
		handleSave,
		handleDelete,
		syncDialogOpen,
		setSyncDialogOpen,
		handleSyncConfirm,
	};
}
