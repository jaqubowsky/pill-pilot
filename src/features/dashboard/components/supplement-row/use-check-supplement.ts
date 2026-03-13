"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markTaken } from "@/features/dashboard/api/actions/mark-taken";
import { markUntaken } from "@/features/dashboard/api/actions/mark-untaken";

export function useCheckSupplement(initialChecked: boolean, onComplete?: () => void) {
	const [checked, setChecked] = useState(initialChecked);
	const [isPending, startTransition] = useTransition();

	function check(scheduleId: string, date: string) {
		setChecked(true);
		startTransition(async () => {
			const result = await markTaken({ scheduleId, date });
			if (result?.serverError) {
				setChecked(false);
				toast.error(result.serverError);
				return;
			}
			onComplete?.();
		});
	}

	function uncheck(scheduleId: string, date: string) {
		setChecked(false);
		startTransition(async () => {
			const result = await markUntaken({ scheduleId, date });
			if (result?.serverError) {
				setChecked(true);
				toast.error(result.serverError);
				return;
			}
			onComplete?.();
		});
	}

	return {
		checked,
		pending: isPending,
		check,
		uncheck,
	};
}
