"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateSchedule } from "@/features/dashboard/api/actions/update-schedule";
import {
	type PreviewSupplementSheetValues,
	previewSupplementSheetSchema,
} from "@/features/protocol-wizard/components/parsed-preview/preview-supplement-sheet/preview-supplement-sheet.schema";

export type Sibling = { timeBlockName: string };

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
	const router = useRouter();
	const methods = useForm<PreviewSupplementSheetValues>({
		resolver: zodResolver(previewSupplementSheetSchema),
		defaultValues,
	});

	const [siblings, setSiblings] = useState<Sibling[] | null>(null);
	const lastValuesRef = useRef<PreviewSupplementSheetValues | null>(null);
	const changedFieldsRef = useRef<string[] | null>(null);

	const { execute, isPending } = useAction(updateSchedule, {
		onSuccess: ({ data }) => {
			if (data?.siblings) {
				setSiblings(data.siblings);
				changedFieldsRef.current = data.changedFields;
			} else {
				setSiblings(null);
				changedFieldsRef.current = null;
				onClose();
			}
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const handleSubmit = methods.handleSubmit((values) => {
		lastValuesRef.current = values;
		execute({ scheduleId, ...values });
	});

	function handleApplyToAll() {
		if (!lastValuesRef.current || !changedFieldsRef.current) return;
		execute({
			scheduleId,
			...lastValuesRef.current,
			updateSiblings: true,
			changedFields: changedFieldsRef.current,
		});
	}

	function handleSkipSiblings() {
		setSiblings(null);
		changedFieldsRef.current = null;
		onClose();
		router.refresh();
	}

	const showSiblings = siblings !== null;

	return {
		methods,
		handleSubmit,
		isPending,
		showSiblings,
		siblings,
		changedFields: changedFieldsRef.current,
		handleApplyToAll,
		handleSkipSiblings,
	};
}
