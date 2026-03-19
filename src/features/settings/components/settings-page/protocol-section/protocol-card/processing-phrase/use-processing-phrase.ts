"use client";

import { useEffect, useState } from "react";

const PHRASE_COUNT = 9;

export function useProcessingPhrase() {
	const [index, setIndex] = useState(0);
	const [fading, setFading] = useState(false);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		const interval = setInterval(() => {
			setFading(true);
			timeoutId = setTimeout(() => {
				setIndex((prev) => (prev + 1) % PHRASE_COUNT);
				setFading(false);
			}, 300);
		}, 3000);
		return () => {
			clearInterval(interval);
			clearTimeout(timeoutId);
		};
	}, []);

	return { index, fading };
}
