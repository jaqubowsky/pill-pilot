import type { ShopOption } from "../use-cart-price-sheet";

type UseShopSelectorParams = {
	shops: ShopOption[];
	setSelectedShopId: (id: string | null) => void;
	setShopName: (name: string) => void;
};

export function useShopSelector({ shops, setSelectedShopId, setShopName }: UseShopSelectorParams) {
	function handleSelectShop(e: React.ChangeEvent<HTMLSelectElement>) {
		const val = e.target.value;
		setSelectedShopId(val || null);
		const shop = shops.find((s) => s.id === val);
		if (shop) setShopName(shop.name);
	}

	function handleClearShop() {
		setSelectedShopId(null);
		setShopName("");
	}

	return { handleSelectShop, handleClearShop };
}
