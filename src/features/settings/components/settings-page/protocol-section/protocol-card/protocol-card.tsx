"use client";

import { Loader2, Pencil, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { ProcessingPhrase } from "./processing-phrase";
import { useProtocolCard } from "./use-protocol-card";

type ProtocolCardProps = {
	protocol: ProtocolWithSchedules;
	borderColor: string;
};

export function ProtocolCard({ protocol, borderColor }: ProtocolCardProps) {
	const t = useTranslations();
	const {
		archiveConfirmOpen,
		setArchiveConfirmOpen,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		isDraft,
		isArchived,
		isProcessing,
		isFailed,
		isArchiving,
		isReactivating,
		isDeleting,
		handleEdit,
		handleContinueDraft,
		handleArchive,
		handleReactivate,
		handleDelete,
		handleRetry,
	} = useProtocolCard({ protocol });

	return (
		<>
			<div
				className={cn(
					"bg-surface-raised border border-edge-subtle rounded-xl shadow-sm border-t-4",
					isArchived && "opacity-60",
				)}
				style={{ borderTopColor: borderColor }}
			>
				<div className="flex items-center justify-between px-md py-sm">
					<span className="text-sm font-bold text-content truncate min-w-0">{protocol.name}</span>
					<div className="flex items-center gap-sm shrink-0">
						{isProcessing ? (
							<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-brand-100 text-brand-700 flex items-center gap-xs">
								<Loader2 className="size-3 animate-spin" />
								{t("settings.statusProcessing")}
							</Badge>
						) : isFailed ? (
							<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-danger-bg text-danger">
								{t("settings.statusFailed")}
							</Badge>
						) : isDraft ? (
							<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-warning-bg text-[#8B6914]">
								{t("settings.statusDraft")}
							</Badge>
						) : isArchived ? (
							<>
								<button
									type="button"
									className="opacity-[1.67] p-1.5 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 active:scale-95 transition-all disabled:opacity-50"
									onClick={handleReactivate}
									disabled={isReactivating}
									aria-label={t("common.reactivate")}
								>
									<RotateCcw className="size-4 stroke-[2.5]" />
								</button>
								<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-surface-sunken text-content-muted">
									{t("settings.statusArchived")}
								</Badge>
							</>
						) : (
							<>
								<button
									type="button"
									className="p-1.5 rounded-lg text-content-muted hover:bg-surface-sunken active:scale-95 transition-all"
									onClick={handleEdit}
									aria-label={t("common.edit")}
								>
									<Pencil className="size-4 stroke-2" />
								</button>
								<Badge className="rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide bg-success-bg text-brand-700">
									{t("settings.statusActive")}
								</Badge>
							</>
						)}
					</div>
				</div>

				{isProcessing && (
					<div className="px-md pb-md pt-sm border-t border-edge-subtle flex flex-col gap-sm">
						<ProcessingPhrase />
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setDeleteConfirmOpen(true)}
						>
							<Trash2 className="size-4" />
							{t("common.delete")}
						</Button>
					</div>
				)}

				{isFailed && (
					<div className="px-md pb-md pt-sm border-t border-edge-subtle flex flex-col gap-sm">
						<p className="text-sm text-danger">{t("settings.failedDescription")}</p>
						<Button className="w-full" onClick={handleRetry}>
							<RefreshCw className="size-4" />
							{t("settings.retry")}
						</Button>
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setDeleteConfirmOpen(true)}
						>
							<Trash2 className="size-4" />
							{t("common.delete")}
						</Button>
					</div>
				)}

				{isDraft && (
					<div className="px-md pb-md pt-sm border-t border-edge-subtle flex flex-col gap-sm">
						<Button className="w-full" onClick={handleContinueDraft}>
							{t("settings.continueDraft")}
						</Button>
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setDeleteConfirmOpen(true)}
						>
							<Trash2 className="size-4" />
							{t("common.delete")}
						</Button>
					</div>
				)}

				{!isDraft && !isArchived && !isProcessing && !isFailed && (
					<div className="px-md pb-md pt-sm border-t border-edge-subtle">
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setArchiveConfirmOpen(true)}
						>
							{t("common.archive")}
						</Button>
					</div>
				)}

				{isArchived && (
					<div className="px-md pb-md pt-sm border-t border-edge-subtle">
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setDeleteConfirmOpen(true)}
						>
							<Trash2 className="size-4" />
							{t("common.delete")}
						</Button>
					</div>
				)}
			</div>

			<AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("settings.archiveConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("settings.archiveConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
							{t("common.archive")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("settings.deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("settings.deleteConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
