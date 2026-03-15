"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateSchedule } from "@/features/dashboard/api/actions/update-schedule";
import {
	type PreviewSupplementSheetValues,
	previewSupplementSheetSchema,
} from "@/features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/preview-supplement-sheet.schema";

type UseScheduleEditSheetParams = {
	scheduleId: string;
	defaultValues: PreviewSupplementSheetValues;
	onClose: () => void;
};

export function useScheduleEditSheet({
	scheduleId,
	defaultValues,
	onClose,
}: UseScheduleEditSheetParams) {
	const methods = useForm<PreviewSupplementSheetValues>({
		resolver: zodResolver(previewSupplementSheetSchema),
		defaultValues,
	});

	const { execute, isPending } = useAction(updateSchedule, {
		onSuccess: () => onClose(),
		onError: ({ error }) => toast.error(error.serverError),
	});

	const handleSubmit = methods.handleSubmit((values) => {
		execute({ scheduleId, ...values });
	});

	return { methods, handleSubmit, isPending };
}
