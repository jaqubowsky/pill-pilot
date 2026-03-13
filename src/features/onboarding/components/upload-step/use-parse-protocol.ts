"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { saveDraftProtocol } from "@/features/onboarding/api/actions/save-draft-protocol";
import type { ParsedProtocol } from "@/features/onboarding/schemas/parsed-protocol-schema";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/onboarding/types";

type ParseStatus = "idle" | "parsing" | "saving" | "error";

type UserContext = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function useParseProtocol(context: UserContext) {
	const [status, setStatus] = useState<ParseStatus>("idle");
	const [errorKey, setErrorKey] = useState<string | null>(null);
	const router = useRouter();

	const { execute: saveDraft } = useAction(saveDraftProtocol, {
		onSuccess: () => {
			router.push("/protocol/new/preview");
		},
		onError: () => {
			setStatus("error");
			setErrorKey("errors.generic");
		},
	});

	async function parseFile(file: File) {
		setStatus("parsing");
		setErrorKey(null);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("supplements", JSON.stringify(context.supplements));
		formData.append("timeBlocks", JSON.stringify(context.timeBlocks));

		let parsed: ParsedProtocol;

		try {
			const res = await fetch("/api/protocol/parse", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				const errorCode = json?.error ?? "ai_error";
				setStatus("error");
				setErrorKey(`onboarding.errors.${errorCode}`);
				return;
			}

			parsed = await res.json();
		} catch {
			setStatus("error");
			setErrorKey("errors.generic");
			return;
		}

		setStatus("saving");

		saveDraft({
			name: parsed.protocolName,
			parsedData: JSON.stringify(parsed),
		});
	}

	return { status, errorKey, parseFile };
}
