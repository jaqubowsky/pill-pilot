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
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [userInstructions, setUserInstructions] = useState("");

	const { state, parseFile: rawParseFile } = useParseProtocol({
		supplements,
		timeBlocks,
		activeProtocols,
	});

	const isParsing = state.status === "uploading";

	function selectFile(file: File) {
		setFileName(file.name);
		setPendingFile(file);
	}

	function confirmUpload() {
		if (!pendingFile) return;
		rawParseFile(pendingFile, userInstructions.trim());
		setPendingFile(null);
	}

	function skipUpload() {
		if (!pendingFile) return;
		rawParseFile(pendingFile, "");
		setPendingFile(null);
		setUserInstructions("");
	}

	function cancelUpload() {
		setPendingFile(null);
		setUserInstructions("");
	}

	function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) selectFile(file);
	}

	function openCamera() {
		cameraInputRef.current?.click();
	}

	return {
		cameraInputRef,
		isParsing,
		fileName,
		pendingFile,
		userInstructions,
		setUserInstructions,
		errorKey: state.status === "error" ? state.errorKey : null,
		selectFile,
		confirmUpload,
		skipUpload,
		cancelUpload,
		handleCameraChange,
		openCamera,
	};
}
