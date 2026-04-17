"use client";

import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { ProtocolFormBase } from "../protocol-form-base";
import type { ProtocolFormData } from "../protocol-form-base";
import { useImportProtocolForm } from "./use-import-protocol-form";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

type ImportProtocolFormProps = {
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	shareToken: string;
	initialData: ProtocolFormData;
	timeBlocksToCreate: TimeBlockToCreate[];
};

export function ImportProtocolForm({
	existingSupplements,
	timeBlocks,
	shareToken,
	initialData,
	timeBlocksToCreate,
}: ImportProtocolFormProps) {
	const t = useTranslations();
	const form = useImportProtocolForm({ timeBlocks, shareToken, initialData, timeBlocksToCreate });

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<h1 className="font-display text-2xl text-content">{t("settings.share.importTitle")}</h1>
				<p className="text-base text-content-muted">{t("settings.share.importDescription")}</p>
			</div>

			<ProtocolFormBase
				{...form}
				existingSupplements={existingSupplements}
				timeBlocks={timeBlocks}
				submitLabel={form.isPending ? t("common.saving") : t("settings.share.importSubmit")}
				onSubmit={form.handleSubmit}
			/>
		</div>
	);
}
