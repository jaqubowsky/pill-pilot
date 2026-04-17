"use client";

import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";
import { useProtocolName } from "./use-protocol-name";
import { useSupplementSheet } from "./use-supplement-sheet";

export type ProtocolFormData = {
	name: string;
	supplements: IdentifiedSupplement[];
};

export function useProtocolFormBase({
	timeBlocks,
	initialData,
}: {
	timeBlocks: TimeBlockSummary[];
	initialData?: ProtocolFormData;
}) {
	const protocolName = useProtocolName(initialData?.name ?? "");
	const sheet = useSupplementSheet({
		timeBlocks,
		initialSupplements: initialData?.supplements ?? [],
	});

	return { protocolName, ...sheet };
}
