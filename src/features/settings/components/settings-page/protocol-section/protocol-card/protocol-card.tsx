"use client";

import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import { cn } from "@/shared/lib/utils";
import { ArchiveConfirmDialog } from "./archive-confirm-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { ProtocolCardActions } from "./protocol-card-actions";
import { ProtocolCardHeader } from "./protocol-card-header";
import { useProtocolCard } from "./use-protocol-card";

type ProtocolCardProps = {
	protocol: ProtocolWithSchedules;
	borderColor: string;
};

export function ProtocolCard({ protocol, borderColor }: ProtocolCardProps) {
	const {
		archiveConfirmOpen,
		setArchiveConfirmOpen,
		deleteConfirmOpen,
		setDeleteConfirmOpen,
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
					protocol.status === "archived" && "opacity-60",
				)}
				style={{ borderTopColor: borderColor }}
			>
				<ProtocolCardHeader
					protocol={protocol}
					onEdit={handleEdit}
					onReactivate={handleReactivate}
					isReactivating={isReactivating}
				/>
				<ProtocolCardActions
					status={protocol.status}
					onContinueDraft={handleContinueDraft}
					onRetry={handleRetry}
					onRequestArchive={() => setArchiveConfirmOpen(true)}
					onRequestDelete={() => setDeleteConfirmOpen(true)}
				/>
			</div>

			<ArchiveConfirmDialog
				open={archiveConfirmOpen}
				onOpenChange={setArchiveConfirmOpen}
				onConfirm={handleArchive}
				disabled={isArchiving}
			/>
			<DeleteConfirmDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				onConfirm={handleDelete}
				disabled={isDeleting}
			/>
		</>
	);
}
