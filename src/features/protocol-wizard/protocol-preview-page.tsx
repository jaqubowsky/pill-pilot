import type { ComponentType } from "react";
import { redirect } from "next/navigation";
import { getPriceList } from "@/shared/api/queries/get-price-list";
import type { PriceSheetComponentProps } from "./components/parsed-preview/parsed-preview";
import { getProtocolForPreview } from "./api/queries/get-protocol-for-preview";
import { getSupplementSummaries } from "./api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "./api/queries/get-time-block-summaries";
import { ParsedPreview } from "./components/parsed-preview";

type Props = {
	userId: string;
	protocolId: string;
	PriceSheetComponent?: ComponentType<PriceSheetComponentProps>;
};

export async function ProtocolPreviewPage({ userId, protocolId, PriceSheetComponent }: Props) {
	const draft = await getProtocolForPreview(protocolId, userId);
	if (!draft) redirect("/settings");

	const [timeBlocks, supplements, priceListData] = await Promise.all([
		getTimeBlockSummaries(userId),
		getSupplementSummaries(userId),
		getPriceList(userId),
	]);

	return (
		<ParsedPreview
			protocolId={draft.protocol.id}
			initialParsed={draft.parsed}
			timeBlocks={timeBlocks}
			existingSupplements={supplements}
			priceListItems={priceListData.items}
			priceListShopOptions={priceListData.shopOptions}
			PriceSheetComponent={PriceSheetComponent}
		/>
	);
}
