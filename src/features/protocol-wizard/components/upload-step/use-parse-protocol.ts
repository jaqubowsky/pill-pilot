"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";

type ParseStatus = "idle" | "uploading" | "error";

type UserContext = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function useParseProtocol(context: UserContext) {
	const [status, setStatus] = useState<ParseStatus>("idle");
	const [errorKey, setErrorKey] = useState<string | null>(null);
	const router = useRouter();
	const t = useTranslations();

	async function parseFile(file: File) {
		setStatus("uploading");
		setErrorKey(null);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("supplements", JSON.stringify(context.supplements));
		formData.append("timeBlocks", JSON.stringify(context.timeBlocks));

		try {
			const res = await fetch("/api/protocol/parse", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				const errorCode = json?.error ?? "ai_error";
				setStatus("error");
				setErrorKey(`protocolWizard.errors.${errorCode}`);
				return;
			}

			toast.success(t("protocolWizard.uploadSuccess"));
			router.push("/settings");
		} catch {
			setStatus("error");
			setErrorKey("errors.generic");
		}
	}

	return { status, errorKey, parseFile };
}
