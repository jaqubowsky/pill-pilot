import { getTranslations } from "next-intl/server";
import { shopRepository } from "@/shared/repositories/shop-repository";
import { getStockList } from "./api/queries/get-stock-list";
import { StockListView } from "./components/stock-list";

function mapShopOptions(shops: { id: string; name: string }[]) {
	return shops.map((s) => ({ id: s.id, name: s.name }));
}

export async function StockPage({ userId }: { userId: string }) {
	const t = await getTranslations();

	const [stockData, shops] = await Promise.all([
		getStockList(userId),
		shopRepository.findByUserId(userId),
	]);

	const shopOptions = mapShopOptions(shops);

	return (
		<div className="px-md pt-2xl pb-3xl">
			<h1 className="font-display text-2xl text-content mb-lg">{t("stock.title")}</h1>
			<div className="flex flex-col gap-lg">
				<StockListView data={stockData} shops={shopOptions} />
			</div>
		</div>
	);
}
