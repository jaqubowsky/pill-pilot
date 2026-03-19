import { getTranslations } from "next-intl/server";
import { getPriceList } from "@/shared/api/queries/get-price-list";
import { Separator } from "@/shared/components/ui/separator";
import { getRecentScans } from "./api/queries/get-recent-scans";
import { getShoppingList } from "./api/queries/get-shopping-list";
import { PriceList } from "./components/price-list";
import { ShoppingList } from "./components/shopping-list";

export async function ShoppingPage({ userId }: { userId: string }) {
	const t = await getTranslations();
	const [groups, priceListData, recentScans] = await Promise.all([
		getShoppingList(userId),
		getPriceList(userId),
		getRecentScans(userId),
	]);

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<h1 className="font-display text-2xl text-content">{t("shopping.title")}</h1>
			<ShoppingList groups={groups} />
			<Separator className="border-edge-subtle" />
			<PriceList
				items={priceListData.items}
				shopOptions={priceListData.shopOptions}
				recentScans={recentScans}
			/>
		</div>
	);
}
