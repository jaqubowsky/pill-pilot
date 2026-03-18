"use client";

import { useState } from "react";
import { useCheckSupplement } from "./use-check-supplement";

type Params = {
	scheduleId: string;
	initialChecked: boolean;
	hasTimer: boolean;
};

export function useSupplementRow({ scheduleId, initialChecked, hasTimer }: Params) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [timerPromptOpen, setTimerPromptOpen] = useState(false);

	const { checked, pending, check, uncheck } = useCheckSupplement(initialChecked);

	function handleClick() {
		if (checked) {
			setConfirmOpen(true);
		} else if (hasTimer) {
			setTimerPromptOpen(true);
		} else {
			check(scheduleId);
		}
	}

	function handleTimerConfirm(skipTimer: boolean) {
		setTimerPromptOpen(false);
		check(scheduleId, skipTimer);
	}

	function handleConfirmUncheck() {
		setConfirmOpen(false);
		uncheck(scheduleId);
	}

	return {
		checked,
		pending,
		confirmOpen,
		setConfirmOpen,
		timerPromptOpen,
		setTimerPromptOpen,
		handleClick,
		handleTimerConfirm,
		handleConfirmUncheck,
	};
}
