"use client";

import { useRef, useState } from "react";

type UseFileDropzoneParams = {
	onFile: (file: File) => void;
};

export function useFileDropzone({ onFile }: UseFileDropzoneParams) {
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(true);
	}

	function handleDragLeave() {
		setIsDragging(false);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) onFile(file);
	}

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) onFile(file);
	}

	function handleClick() {
		inputRef.current?.click();
	}

	return {
		isDragging,
		inputRef,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleInputChange,
		handleClick,
	};
}
