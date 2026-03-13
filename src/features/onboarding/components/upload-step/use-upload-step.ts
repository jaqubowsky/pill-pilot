"use client";

import { useRef } from "react";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/onboarding/types";
import { useParseProtocol } from "./use-parse-protocol";

type UseUploadStepParams = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function useUploadStep({ supplements, timeBlocks }: UseUploadStepParams) {
	const cameraInputRef = useRef<HTMLInputElement>(null);

	const { status, errorKey, parseFile } = useParseProtocol({ supplements, timeBlocks });

	const isParsing = status === "parsing" || status === "saving";

	function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) parseFile(file);
	}

	function openCamera() {
		cameraInputRef.current?.click();
	}

	return {
		cameraInputRef,
		isParsing,
		errorKey,
		parseFile,
		handleCameraChange,
		openCamera,
	};
}
