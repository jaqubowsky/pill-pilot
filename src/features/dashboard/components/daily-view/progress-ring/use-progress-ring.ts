"use client";

import { useEffect, useState } from "react";

const CIRCUMFERENCE = 2 * Math.PI * ((80 - 6) / 2);

export function useProgressRing(completed: number, total: number) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 50);
		return () => clearTimeout(timer);
	}, []);

	const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
	const offset = mounted ? CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE : CIRCUMFERENCE;

	return { percent, offset, circumference: CIRCUMFERENCE };
}
