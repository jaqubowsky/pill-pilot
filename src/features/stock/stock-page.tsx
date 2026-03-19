import { getTranslations } from "next-intl/server";
import { getShopOptions } from "./api/queries/get-shop-options";
import { getStockList } from "./api/queries/get-stock-list";
import { StockListView } from "./components/stock-list";

export async function StockPage({ userId }: { userId: string }) {
	const t = await getTranslations();

	const [stockData, shopOptions] = await Promise.all([
		getStockList(userId),
		getShopOptions(userId),
	]);

	return (
		<div className="px-md pt-2xl pb-3xl">
			<h1 className="font-display text-2xl text-content mb-lg">{t("stock.title")}</h1>
			<div className="flex flex-col gap-lg">
				<StockListView data={stockData} shops={shopOptions} />
			</div>
		</div>
	);
}
