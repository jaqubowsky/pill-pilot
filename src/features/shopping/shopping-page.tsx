import { getTranslations } from "next-intl/server";

export async function ShoppingPage({ userId }: { userId: string }) {
	const t = await getTranslations();

	return (
		<div className="px-md pt-2xl pb-3xl">
			<h1 className="font-display text-2xl text-content mb-lg">{t("shopping.title")}</h1>
		</div>
	);
}
