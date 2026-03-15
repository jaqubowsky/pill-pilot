"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { archiveProtocol } from "@/features/settings/api/actions/archive-protocol";
import { deleteProtocol } from "@/features/settings/api/actions/delete-protocol";
import { reactivateProtocol } from "@/features/settings/api/actions/reactivate-protocol";
import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";

type UseProtocolCardParams = {
	protocol: ProtocolWithSchedules;
};

export function useProtocolCard({ protocol }: UseProtocolCardParams) {
	const t = useTranslations();
	const router = useRouter();

	const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const isDraft = protocol.status === "draft";
	const isArchived = protocol.status === "archived";
	const isProcessing = protocol.status === "processing";
	const isFailed = protocol.status === "failed";

	const { execute: execArchive, isPending: isArchiving } = useAction(archiveProtocol, {
		onSuccess: () => {
			toast.success(t("settings.protocolArchived"));
			setArchiveConfirmOpen(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: execReactivate, isPending: isReactivating } = useAction(reactivateProtocol, {
		onSuccess: () => {
			toast.success(t("settings.protocolReactivated"));
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	const { execute: execDelete, isPending: isDeleting } = useAction(deleteProtocol, {
		onSuccess: () => {
			toast.success(t("settings.protocolDeleted"));
			setDeleteConfirmOpen(false);
		},
		onError: ({ error }) => toast.error(error.serverError),
	});

	function handleEdit() {
		router.push(`/protocol/edit/${protocol.id}`);
	}

	function handleContinueDraft() {
		router.push(`/protocol/new/preview/${protocol.id}`);
	}

	function handleRetry() {
		execDelete({ protocolId: protocol.id });
		router.push("/protocol/new");
	}

	function handleArchive() {
		execArchive({ protocolId: protocol.id });
	}

	function handleReactivate() {
		execReactivate({ protocolId: protocol.id });
	}

	function handleDelete() {
		execDelete({ protocolId: protocol.id });
	}

	return {
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
	};
}
