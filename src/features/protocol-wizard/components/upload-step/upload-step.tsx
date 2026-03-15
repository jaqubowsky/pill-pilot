"use client";

import { Camera, PenLine } from "lucide-react";
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
	const { cameraInputRef, isParsing, errorKey, parseFile, handleCameraChange, openCamera } =
		useUploadStep({ supplements, timeBlocks });

	if (isParsing) {
		return (
			<div className="fixed inset-0 z-50 bg-surface flex flex-col items-center justify-center gap-lg">
				<h1 className="font-display text-xl text-content text-center">
					{t("protocolWizard.uploadingTitle")}
				</h1>
				<div className="size-20 flex items-center justify-center">
					<div className="size-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<BackButton />
				<h1 className="font-display text-2xl text-content">
					{t("protocolWizard.addProtocolTitle")}
				</h1>
				<p className="text-base text-content-muted">{t("protocolWizard.uploadDescription")}</p>
			</div>

			<div className="flex flex-col gap-md">
				<FileDropzone
					onFile={parseFile}
					disabled={isParsing}
					accept=".pdf,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.webp"
					label={t("protocolWizard.dropzoneLabel")}
					hint={t("protocolWizard.supportedFormats")}
				/>

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
