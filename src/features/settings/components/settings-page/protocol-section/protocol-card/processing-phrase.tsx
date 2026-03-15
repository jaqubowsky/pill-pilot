"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

const PHRASE_COUNT = 9;

export function ProcessingPhrase() {
	const t = useTranslations("settings");
	const [index, setIndex] = useState(0);
	const [fading, setFading] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setFading(true);
			setTimeout(() => {
				setIndex((prev) => (prev + 1) % PHRASE_COUNT);
				setFading(false);
			}, 300);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	const key = `processingPhrase${index}` as Parameters<typeof t>[0];

	return (
		<p
			className={cn(
				"text-sm text-content-muted transition-opacity duration-300",
				fading ? "opacity-0" : "opacity-100",
			)}
		>
			{t(key)}
		</p>
	);
}
