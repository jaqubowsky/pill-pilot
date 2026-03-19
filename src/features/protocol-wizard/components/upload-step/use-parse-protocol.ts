"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type {
	ActiveProtocolSummary,
	ExistingSupplementSummary,
	TimeBlockSummary,
} from "@/features/protocol-wizard/types";

type ParseState =
	| { status: "idle" }
	| { status: "uploading" }
	| { status: "error"; errorKey: string };

type UseParseProtocolParams = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	activeProtocols: ActiveProtocolSummary[];
};

export function useParseProtocol({
	supplements,
	timeBlocks,
	activeProtocols,
}: UseParseProtocolParams) {
	const [state, setState] = useState<ParseState>({ status: "idle" });

	const router = useRouter();
	const t = useTranslations();

	async function parseFile(file: File, userInstructions: string) {
		setState({ status: "uploading" });

		const formData = new FormData();
		formData.append("file", file);
		formData.append("supplements", JSON.stringify(supplements));
		formData.append("timeBlocks", JSON.stringify(timeBlocks));

		formData.append("activeProtocols", JSON.stringify(activeProtocols));

		if (userInstructions) {
			formData.append("userInstructions", userInstructions);
		}

		try {
			const res = await fetch("/api/protocol/parse", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				const errorCode = json?.error ?? "ai_error";
				setState({
					status: "error",
					errorKey: `protocolWizard.errors.${errorCode}`,
				});
				return;
			}

			toast.success(t("protocolWizard.uploadSuccess"));
			router.push("/settings");
		} catch {
			setState({ status: "error", errorKey: "errors.generic" });
		}
	}

	return { state, parseFile };
}
