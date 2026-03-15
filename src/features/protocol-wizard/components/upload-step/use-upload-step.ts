"use client";

import { useRef, useState } from "react";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { useParseProtocol } from "./use-parse-protocol";

type UseUploadStepParams = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function useUploadStep({ supplements, timeBlocks }: UseUploadStepParams) {
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);

	const {
		status,
		errorKey,
		parseFile: rawParseFile,
	} = useParseProtocol({ supplements, timeBlocks });

	const isParsing = status === "uploading";

	function parseFile(file: File) {
		setFileName(file.name);
		rawParseFile(file);
	}

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
		fileName,
		errorKey,
		parseFile,
		handleCameraChange,
		openCamera,
	};
}
