"use client";

import { useState } from "react";
import { useCheckSupplement } from "./use-check-supplement";

type Params = {
	scheduleId: string;
	date: string;
	initialChecked: boolean;
	onCheckChange?: () => void;
};

export function useSupplementRow({ scheduleId, date, initialChecked, onCheckChange }: Params) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { checked, pending, check, uncheck } = useCheckSupplement(initialChecked, onCheckChange);

	function handleClick() {
		if (checked) {
			setConfirmOpen(true);
		} else {
			check(scheduleId, date);
		}
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
		handleClick,
		handleConfirmUncheck,
		handleCloseConfirm,
	};
}
