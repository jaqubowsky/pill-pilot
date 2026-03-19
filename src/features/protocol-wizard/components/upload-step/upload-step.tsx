"use client";

import { Camera, FileText, Loader2, PenLine } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BackButton } from "@/features/protocol-wizard/components/back-button";
import type {
	ActiveProtocolSummary,
	ExistingSupplementSummary,
	TimeBlockSummary,
} from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { FileDropzone } from "./file-dropzone";
import { useUploadStep } from "./use-upload-step";

type UploadStepProps = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	activeProtocols: ActiveProtocolSummary[];
};

export function UploadStep({ supplements, timeBlocks, activeProtocols }: UploadStepProps) {
	const t = useTranslations();
	const {
		cameraInputRef,
		isParsing,
		fileName,
		pendingFile,
		userInstructions,
		setUserInstructions,
		errorKey,
		selectFile,
		confirmUpload,
		skipUpload,
		cancelUpload,
		handleCameraChange,
		openCamera,
	} = useUploadStep({ supplements, timeBlocks, activeProtocols });

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
						onFile={selectFile}
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

			<Dialog open={!!pendingFile} onOpenChange={(open) => !open && cancelUpload()}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>{t("protocolWizard.instructionsDialogTitle")}</DialogTitle>
						<DialogDescription>
							{t("protocolWizard.instructionsDialogDescription")}
						</DialogDescription>
					</DialogHeader>
					<textarea
						value={userInstructions}
						onChange={(e) => setUserInstructions(e.target.value)}
						maxLength={1000}
						rows={3}
						placeholder={t("protocolWizard.userInstructionsPlaceholder")}
						className="w-full rounded-xl border border-edge bg-surface-raised p-md text-sm text-content placeholder:text-content-faint resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
					/>
					<DialogFooter>
						<Button variant="outline" onClick={skipUpload}>
							{t("protocolWizard.instructionsSkip")}
						</Button>
						<Button onClick={confirmUpload} disabled={!userInstructions.trim()}>
							{t("protocolWizard.instructionsSend")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
