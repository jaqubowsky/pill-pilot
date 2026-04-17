"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { importSharedProtocol } from "../../api/actions/import-shared-protocol";
import { toSerializedProtocol } from "../../lib/supplement-serialization";
import { useProtocolFormBase, type ProtocolFormData } from "../protocol-form-base";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

export function useImportProtocolForm({
	timeBlocks,
	shareToken,
	initialData,
	timeBlocksToCreate,
}: {
	timeBlocks: TimeBlockSummary[];
	shareToken: string;
	initialData: ProtocolFormData;
	timeBlocksToCreate: TimeBlockToCreate[];
}) {
	const t = useTranslations();
	const router = useRouter();
	const formBase = useProtocolFormBase({ timeBlocks, initialData });

	const { execute, isPending } = useAction(importSharedProtocol, {
		onSuccess: ({ data }) => {
			if (data?.protocolId) {
				toast.success(t("settings.share.importSuccess"));
				router.push(`/protocol/new/preview/${data.protocolId}`);
			}
		},
		onError: () => toast.error(t("errors.generic")),
	});

	function handleSubmit() {
		if (!formBase.protocolName.validate()) return;

		if (formBase.supplements.length === 0) {
			toast.error(t("protocolWizard.manual.addAtLeastOneSupplement"));
			return;
		}

		execute({
			shareToken,
			name: formBase.protocolName.name,
			parsedData: toSerializedProtocol(formBase.protocolName.name, formBase.supplements),
			timeBlocksToCreate,
		});
	}

	return { ...formBase, isPending, handleSubmit };
}
