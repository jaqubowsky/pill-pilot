import { getTranslations } from "next-intl/server";
import { getStockList } from "./api/queries/get-stock-list";
import { StockListView } from "./components/stock-list";

export async function StockPage({ userId }: { userId: string }) {
	const t = await getTranslations();
	const stockData = await getStockList(userId);

	return (
		<div className="px-md pt-2xl pb-3xl">
			<h1 className="font-display text-2xl text-content mb-lg">{t("stock.title")}</h1>
			<StockListView data={stockData} />
		</div>
	);
}
