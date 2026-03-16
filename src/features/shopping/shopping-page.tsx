import { getTranslations } from "next-intl/server";
import { Separator } from "@/shared/components/ui/separator";
import { getPriceList } from "./api/queries/get-price-list";
import { getShoppingList } from "./api/queries/get-shopping-list";
import { PriceList } from "./components/price-list";
import { ShoppingList } from "./components/shopping-list";

export async function ShoppingPage({ userId }: { userId: string }) {
	const t = await getTranslations();
	const [groups, priceListData] = await Promise.all([
		getShoppingList(userId),
		getPriceList(userId),
	]);

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<h1 className="font-display text-2xl text-content">{t("shopping.title")}</h1>
			<ShoppingList groups={groups} />
			<Separator className="border-edge-subtle" />
			<PriceList items={priceListData.items} shopOptions={priceListData.shopOptions} />
		</div>
	);
}
