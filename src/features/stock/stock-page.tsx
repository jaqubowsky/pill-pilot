import { getTranslations } from "next-intl/server";
import { getLowStock } from "./api/queries/get-low-stock";
import { getStockList } from "./api/queries/get-stock-list";
import { BuySoonList } from "./components/buy-soon";
import { StockListView } from "./components/stock-list";

export async function StockPage({ userId }: { userId: string }) {
	const t = await getTranslations();
	const [stockData, lowStockItems] = await Promise.all([getStockList(userId), getLowStock(userId)]);

	return (
		<div className="px-md pt-2xl pb-3xl">
			<h1 className="font-display text-2xl text-content mb-lg">{t("stock.title")}</h1>
			<div className="flex flex-col gap-lg">
				{lowStockItems.length > 0 && <BuySoonList items={lowStockItems} />}
				<StockListView data={stockData} />
			</div>
		</div>
	);
}
