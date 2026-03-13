"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markBlockTaken } from "@/features/dashboard/api/actions/mark-block-taken";

type UseCheckAllParams = {
	scheduleIds: string[];
	date: string;
};

export function useCheckAll({ scheduleIds, date }: UseCheckAllParams) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	function openConfirm() {
		setConfirmOpen(true);
	}

	function closeConfirm() {
		setConfirmOpen(false);
	}

	function handleConfirm() {
		setConfirmOpen(false);
		startTransition(async () => {
			const result = await markBlockTaken({ scheduleIds, date });
			if (result?.serverError) {
				toast.error(result.serverError);
			}
		});
	}

	return { confirmOpen, isPending, openConfirm, closeConfirm, handleConfirm };
}
