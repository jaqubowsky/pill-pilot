"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { useProcessingPhrase } from "./use-processing-phrase";

export function ProcessingPhrase() {
	const t = useTranslations("settings");
	const { index, fading } = useProcessingPhrase();

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
