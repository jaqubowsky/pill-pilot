"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { createDraftProtocol } from "../../api/actions/create-draft-protocol";
import { toSerializedProtocol } from "../../lib/supplement-serialization";
import { useProtocolName } from "./use-protocol-name";
import { useSupplementSheet } from "./use-supplement-sheet";

export function useManualProtocolForm({ timeBlocks }: { timeBlocks: TimeBlockSummary[] }) {
	const t = useTranslations();
	const router = useRouter();
	const protocolName = useProtocolName();
	const sheet = useSupplementSheet({ timeBlocks });

	const { execute: executeSave, isPending } = useAction(createDraftProtocol, {
		onSuccess: ({ data }) => {
			if (data?.protocol) {
				toast.success(t("protocolWizard.manual.draftSaved"));
				router.push(`/protocol/new/preview/${data.protocol.id}`);
			}
		},
		onError: () => {
			toast.error(t("errors.generic"));
		},
	});

	function handleSubmit() {
		if (!protocolName.validate()) return;

		if (sheet.supplements.length === 0) {
			toast.error(t("protocolWizard.manual.addAtLeastOneSupplement"));
			return;
		}

		executeSave({
			name: protocolName.name,
			parsedData: toSerializedProtocol(protocolName.name, sheet.supplements),
		});
	}

	return {
		protocolName,
		isPending,
		handleSubmit,
		...sheet,
	};
}
