"use client";

import { Camera, FileText, Loader2, PenLine } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { BackButton } from "@/shared/components/back-button";
import { Button } from "@/shared/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { useUploadStep } from "./use-upload-step";

type UploadStepProps = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function UploadStep({ supplements, timeBlocks }: UploadStepProps) {
	const t = useTranslations();
	const {
		cameraInputRef,
		isParsing,
		fileName,
		errorKey,
		parseFile,
		handleCameraChange,
		openCamera,
	} = useUploadStep({ supplements, timeBlocks });

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl min-h-[calc(100dvh-4rem)]">
			<div className="flex flex-col gap-sm">
				<BackButton />
				<h1 className="font-display text-2xl text-content">
					{t("protocolWizard.addProtocolTitle")}
				</h1>
				<p className="text-base text-content-muted">{t("protocolWizard.uploadDescription")}</p>
			</div>

			<div className="flex flex-col gap-md">
				{isParsing ? (
					<div className="flex flex-col items-center gap-md rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-xl">
						<Loader2 className="size-10 text-brand-500 animate-spin" />
						<div className="flex flex-col items-center gap-xs">
							<p className="text-sm font-medium text-content text-center">
								{t("protocolWizard.uploadingTitle")}
							</p>
							{fileName && (
								<div className="flex items-center gap-xs text-xs text-content-faint">
									<FileText className="size-3 shrink-0" />
									<span className="truncate max-w-48">{fileName}</span>
								</div>
							)}
						</div>
					</div>
				) : (
					<FileDropzone
						onFile={parseFile}
						disabled={isParsing}
						accept=".pdf,.xlsx,.xls,.docx,.txt,.jpg,.jpeg,.png,.webp"
						label={t("protocolWizard.dropzoneLabel")}
						hint={t("protocolWizard.supportedFormats")}
					/>
				)}

				<div className="flex items-center gap-md">
					<div className="h-px flex-1 bg-edge-subtle" />
					<span className="text-xs text-content-faint uppercase tracking-wide">
						{t("protocolWizard.or")}
					</span>
					<div className="h-px flex-1 bg-edge-subtle" />
				</div>

				<Button
					variant="outline"
					onClick={openCamera}
					disabled={isParsing}
					className="w-full flex items-center justify-center gap-sm rounded-xl border-edge bg-surface-raised p-md shadow-sm h-14 active:scale-[0.98] transition-all duration-150"
				>
					<Camera className="size-5 text-brand-500 stroke-[1.5]" />
					<span className="text-sm font-medium text-content">{t("protocolWizard.takePhoto")}</span>
				</Button>

				<input
					ref={cameraInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={handleCameraChange}
				/>

				<div className="flex items-center gap-md">
					<div className="h-px flex-1 bg-edge-subtle" />
					<span className="text-xs text-content-faint uppercase tracking-wide">
						{t("protocolWizard.or")}
					</span>
					<div className="h-px flex-1 bg-edge-subtle" />
				</div>

				<Link
					href="/protocol/new/manual"
					className="w-full flex items-center justify-center gap-sm rounded-xl border border-edge bg-surface-raised p-md shadow-sm h-14 active:scale-[0.98] transition-all duration-150"
				>
					<PenLine className="size-5 text-brand-500 stroke-[1.5]" />
					<span className="text-sm font-medium text-content">
						{t("protocolWizard.addManually")}
					</span>
				</Link>
			</div>

			{errorKey && (
				<p className="text-sm text-danger">
					{t(errorKey as Parameters<typeof t>[0], undefined) ?? t("errors.generic")}
				</p>
			)}

			<div className="flex flex-col items-center gap-xs mt-auto">
				<span className="text-sm text-content-muted">
					{t("protocolWizard.stepOf", { current: 1, total: 2 })}
				</span>
				<div className="flex gap-xs">
					<span className="size-2 rounded-full bg-brand-500" />
					<span className="size-2 rounded-full bg-brand-200" />
				</div>
			</div>
		</div>
	);
}
