import { supplementRepository } from "@/shared/repositories/supplement-repository";
import type { ExistingSupplementSummary } from "../../types";

export async function getSupplementSummaries(userId: string): Promise<ExistingSupplementSummary[]> {
	const supplements = await supplementRepository.findByUserId(userId);

	return supplements.map((s) => ({
		id: s.id,
		name: s.name,
		brandName: s.brandName,
		packageSize: s.packageSize,
	}));
}
