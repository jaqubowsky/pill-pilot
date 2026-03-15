"use client";

import { Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useFileDropzone } from "./use-file-dropzone";

interface FileDropzoneProps {
	onFile: (file: File) => void;
	disabled?: boolean;
	accept: string;
	label: string;
	hint?: string;
}

export function FileDropzone({ onFile, disabled, accept, label, hint }: FileDropzoneProps) {
	const {
		isDragging,
		inputRef,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleInputChange,
		handleClick,
	} = useFileDropzone({ onFile });

	return (
		<Button
			variant="ghost"
			disabled={disabled}
			onClick={handleClick}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={cn(
				"w-full h-auto flex flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed bg-surface-sunken p-xl transition-colors duration-150",
				isDragging ? "border-brand-400 bg-interactive-hover" : "border-edge-strong",
			)}
		>
			<Upload className="size-10 text-content-faint stroke-[1.5]" />
			<p className="text-sm text-content-muted text-center">{label}</p>
			{hint && <p className="text-xs text-content-faint text-center">{hint}</p>}
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				className="hidden"
				onChange={handleInputChange}
			/>
		</Button>
	);
}
