"use client";

import { useTranslations } from "next-intl";
import { BackButton } from "@/features/protocol-wizard/components/back-button";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { ProtocolFormBase } from "../protocol-form-base";
import { useManualProtocolForm } from "./use-manual-protocol-form";

type ManualProtocolFormProps = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function ManualProtocolForm({ supplements, timeBlocks }: ManualProtocolFormProps) {
	const t = useTranslations();
	const form = useManualProtocolForm({ timeBlocks });

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<BackButton />
				<h1 className="font-display text-2xl text-content">{t("protocolWizard.manual.title")}</h1>
				<p className="text-base text-content-muted">{t("protocolWizard.manual.description")}</p>
			</div>

			<ProtocolFormBase
				{...form}
				existingSupplements={supplements}
				timeBlocks={timeBlocks}
				submitLabel={
					form.isPending
						? t("protocolWizard.manual.saving")
						: t("protocolWizard.manual.saveAndPreview")
				}
				onSubmit={form.handleSubmit}
			/>
		</div>
	);
}
