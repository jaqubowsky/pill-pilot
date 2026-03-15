"use client";

import { useState } from "react";
import { useCheckSupplement } from "./use-check-supplement";

type Params = {
	scheduleId: string;
	date: string;
	initialChecked: boolean;
	hasTimer: boolean;
	onCheckChange?: () => void;
};

export function useSupplementRow({
	scheduleId,
	date,
	initialChecked,
	hasTimer,
	onCheckChange,
}: Params) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [timerPromptOpen, setTimerPromptOpen] = useState(false);
	const { checked, pending, check, uncheck } = useCheckSupplement(initialChecked, onCheckChange);

	function handleClick() {
		if (checked) {
			setConfirmOpen(true);
		} else if (hasTimer) {
			setTimerPromptOpen(true);
		} else {
			check(scheduleId, date);
		}
	}

	function handleTimerConfirm(skipTimer: boolean) {
		setTimerPromptOpen(false);
		check(scheduleId, date, skipTimer);
	}

	function handleConfirmUncheck() {
		setConfirmOpen(false);
		uncheck(scheduleId, date);
	}

	function handleCloseConfirm() {
		setConfirmOpen(false);
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
		handleCloseConfirm,
	};
}
