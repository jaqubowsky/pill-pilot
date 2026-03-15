"use client";

import { useRef, useState } from "react";
import type {
	ActiveProtocolSummary,
	ExistingSupplementSummary,
	TimeBlockSummary,
} from "@/features/protocol-wizard/types";
import { useParseProtocol } from "./use-parse-protocol";

type UseUploadStepParams = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	activeProtocols: ActiveProtocolSummary[];
};

export function useUploadStep({ supplements, timeBlocks, activeProtocols }: UseUploadStepParams) {
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [userInstructions, setUserInstructions] = useState("");
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

	const {
		status,
		errorKey,
		parseFile: rawParseFile,
	} = useParseProtocol({ supplements, timeBlocks, activeProtocols, userInstructions });

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

	function toggleInstructions() {
		setIsInstructionsOpen((prev) => !prev);
	}

	return {
		cameraInputRef,
		isParsing,
		fileName,
		errorKey,
		userInstructions,
		setUserInstructions,
		isInstructionsOpen,
		toggleInstructions,
		parseFile,
		handleCameraChange,
		openCamera,
	};
}
