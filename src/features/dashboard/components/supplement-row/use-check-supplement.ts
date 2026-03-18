"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { markTaken } from "@/features/dashboard/api/actions/mark-taken";
import { markUntaken } from "@/features/dashboard/api/actions/mark-untaken";
import { dashboardSearchParams } from "@/features/dashboard/search-params";

export function useCheckSupplement(initialChecked: boolean) {
	const [date] = useQueryState("date", dashboardSearchParams.date);

	const onError = ({ error }: { error: { serverError?: string } }) => {
		if (error.serverError) toast.error(error.serverError);
	};

	const taken = useOptimisticAction(markTaken, {
		currentState: initialChecked,
		updateFn: () => true,
		onError,
	});

	const untaken = useOptimisticAction(markUntaken, {
		currentState: initialChecked,
		updateFn: () => false,
		onError,
	});

	const checked = taken.isExecuting
		? taken.optimisticState
		: untaken.isExecuting
			? untaken.optimisticState
			: initialChecked;

	function check(scheduleId: string, skipTimer?: boolean) {
		taken.execute({ scheduleId, date, skipTimer });
	}

	function uncheck(scheduleId: string) {
		untaken.execute({ scheduleId, date });
	}

	return {
		checked,
		pending: taken.isPending || untaken.isPending,
		check,
		uncheck,
	};
}
