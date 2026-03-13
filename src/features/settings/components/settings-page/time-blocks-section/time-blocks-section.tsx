"use client";

import { useTranslations } from "next-intl";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { Button } from "@/shared/components/ui/button";
import { TimeBlockEditSheet } from "./time-block-edit-sheet";
import { TimeBlockRow } from "./time-block-row";
import { useTimeBlocksSection } from "./use-time-blocks-section";

type TimeBlocksSectionProps = {
	timeBlocks: UserTimeBlock[];
};

export function TimeBlocksSection({ timeBlocks }: TimeBlocksSectionProps) {
	const t = useTranslations();
	const { addSheetOpen, setAddSheetOpen, handleAddBlock } = useTimeBlocksSection();

	return (
		<div>
			<div className="bg-surface-raised rounded-xl">
				{timeBlocks.map((block) => (
					<TimeBlockRow key={block.id} timeBlock={block} />
				))}

				<div className="px-md py-sm">
					<Button variant="ghost" className="w-full text-brand-600" onClick={handleAddBlock}>
						{t("common.addBlock")}
					</Button>
				</div>
			</div>

			<TimeBlockEditSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
		</div>
	);
}
