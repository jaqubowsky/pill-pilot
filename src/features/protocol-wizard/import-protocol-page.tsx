import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { IdentifiedSupplement } from "./lib/supplement-serialization";
import { ImportProtocolForm } from "./components/import-protocol-form";
import type { ProtocolFormData } from "./components/protocol-form-base";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

type ImportProtocolPageProps = {
	shareToken: string;
	protocolName: string;
	initialSupplements: IdentifiedSupplement[];
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	timeBlocksToCreate: TimeBlockToCreate[];
};

export function ImportProtocolPage({
	shareToken,
	protocolName,
	initialSupplements,
	existingSupplements,
	timeBlocks,
	timeBlocksToCreate,
}: ImportProtocolPageProps) {
	const initialData: ProtocolFormData = {
		name: protocolName,
		supplements: initialSupplements,
	};

	return (
		<ImportProtocolForm
			shareToken={shareToken}
			existingSupplements={existingSupplements}
			timeBlocks={timeBlocks}
			initialData={initialData}
			timeBlocksToCreate={timeBlocksToCreate}
		/>
	);
}
