"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/onboarding/types";
import { Button } from "@/shared/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { useUploadStep } from "./use-upload-step";

type UploadStepProps = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	showStepIndicator?: boolean;
};

export function UploadStep({
	supplements,
	timeBlocks,
	showStepIndicator = false,
}: UploadStepProps) {
	const t = useTranslations();
	const { cameraInputRef, isParsing, errorKey, parseFile, handleCameraChange, openCamera } =
		useUploadStep({ supplements, timeBlocks });

	if (isParsing) {
		return (
			<div className="px-md pt-2xl pb-3xl flex flex-col items-center justify-center min-h-[60vh] gap-lg">
				<h1 className="font-display text-xl text-content text-center">
					{t("onboarding.analysingTitle")}
				</h1>
				<div className="size-20 flex items-center justify-center">
					<div className="size-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
				</div>
				<div className="text-center flex flex-col gap-xs">
					<p className="text-sm text-content-muted">{t("onboarding.analysingDescription")}</p>
					<p className="text-sm text-content-faint">{t("onboarding.analysingWait")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<h1 className="font-display text-2xl text-content">{t("onboarding.welcome")}</h1>
				<p className="text-base text-content-muted">{t("onboarding.uploadDescription")}</p>
			</div>

			<div className="flex flex-col gap-md">
				<FileDropzone
					onFile={parseFile}
					disabled={isParsing}
					accept=".pdf,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.webp"
					label={t("onboarding.dropzoneLabel")}
					hint={t("onboarding.supportedFormats")}
				/>

				<div className="flex items-center gap-md">
					<div className="h-px flex-1 bg-edge-subtle" />
					<span className="text-xs text-content-faint uppercase tracking-wide">
						{t("onboarding.or")}
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
					<span className="text-sm font-medium text-content">{t("onboarding.takePhoto")}</span>
				</Button>

				<input
					ref={cameraInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={handleCameraChange}
				/>
			</div>

			{errorKey && (
				<p className="text-sm text-danger">
					{t(errorKey as Parameters<typeof t>[0], undefined) ?? t("errors.generic")}
				</p>
			)}

			{showStepIndicator && (
				<div className="flex flex-col items-center gap-xs mt-auto">
					<span className="text-sm text-content-muted">
						{t("onboarding.stepOf", { current: 1, total: 2 })}
					</span>
					<div className="flex gap-xs">
						<span className="size-2 rounded-full bg-brand-500" />
						<span className="size-2 rounded-full bg-brand-200" />
					</div>
				</div>
			)}
		</div>
	);
}
