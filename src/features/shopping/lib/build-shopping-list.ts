import { toDateString } from "@/shared/lib/date";
import {
	DELIVERY_BUFFER_DAYS,
	forecastDaysInStock,
	type ScheduleConsumption,
} from "@/shared/lib/stock-forecast";

export type ShopInfo = {
	id: string;
	name: string;
	deliveryCost: string | null;
	freeDeliveryThreshold: string | null;
};

export type ShoppingItem = {
	id: string;
	name: string;
	packagePrice: string | null;
	packageSize: number | null;
	shopId: string | null;
	stockUnit: string;
	daysRemaining: number;
	depletionDate: string;
	isMustBuy: boolean;
};

export type ShoppingGroup = {
	shop: ShopInfo | null;
	items: ShoppingItem[];
};

type RawSupplement = {
	id: string;
	name: string;
	currentStock: string | null;
	stockUnit: string;
	packagePrice: string | null;
	packageSize: number | null;
	shopId: string | null;
};

type ScheduleRow = ScheduleConsumption & {
	supplementId: string;
	finishPackage: boolean;
};

const SUGGEST_ADD_DAYS = 30;
const MS_PER_DAY = 86_400_000;

function isOneTimeSupplement(schedules: ScheduleRow[]): boolean {
	return schedules.length > 0 && schedules.every((s) => s.durationDays !== null);
}

function isFinishPackageOnly(schedules: ScheduleRow[]): boolean {
	return schedules.length > 0 && schedules.every((s) => s.finishPackage);
}

function groupSchedulesBySupplement(rows: ScheduleRow[]): Map<string, ScheduleRow[]> {
	const map = new Map<string, ScheduleRow[]>();
	for (const row of rows) {
		const list = map.get(row.supplementId) ?? [];
		list.push(row);
		map.set(row.supplementId, list);
	}
	return map;
}

function groupItemsByShop(items: ShoppingItem[]): Map<string | null, ShoppingItem[]> {
	const map = new Map<string | null, ShoppingItem[]>();
	for (const item of items) {
		const key = item.shopId ?? null;
		const list = map.get(key) ?? [];
		list.push(item);
		map.set(key, list);
	}
	return map;
}

export function buildShoppingList(
	supplements: RawSupplement[],
	scheduleRows: ScheduleRow[],
	shopMap: Map<string, ShopInfo>,
	today: string,
): ShoppingGroup[] {
	const schedulesPerSupplement = groupSchedulesBySupplement(scheduleRows);
	const todayMs = new Date(today).getTime();

	const allItems: ShoppingItem[] = [];

	for (const row of supplements) {
		const schedules = schedulesPerSupplement.get(row.id) ?? [];

		if (isOneTimeSupplement(schedules)) continue;
		if (isFinishPackageOnly(schedules)) continue;

		const stock = Number(row.currentStock);
		const threshold = 7;
		const effectiveThreshold = threshold + DELIVERY_BUFFER_DAYS;

		const daysRemaining = forecastDaysInStock(
			stock,
			schedules.map((s) => ({
				dosageAmount: s.dosageAmount,
				cycleDaysOn: s.cycleDaysOn,
				cycleDaysOff: s.cycleDaysOff,
				startDayOffset: s.startDayOffset,
				durationDays: s.durationDays,
				protocolStartDate: s.protocolStartDate,
			})),
			today,
		);

		if (daysRemaining === Number.POSITIVE_INFINITY) continue;
		if (daysRemaining > SUGGEST_ADD_DAYS) continue;

		const depletionDate = toDateString(new Date(todayMs + daysRemaining * MS_PER_DAY));

		allItems.push({
			id: row.id,
			name: row.name,
			packagePrice: row.packagePrice,
			packageSize: row.packageSize,
			shopId: row.shopId,
			stockUnit: row.stockUnit,
			daysRemaining,
			depletionDate,
			isMustBuy: daysRemaining <= effectiveThreshold,
		});
	}

	allItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

	const grouped = groupItemsByShop(allItems);
	const groups: ShoppingGroup[] = [];

	for (const [shopId, items] of grouped) {
		const shop = shopId ? (shopMap.get(shopId) ?? null) : null;
		groups.push({ shop, items });
	}

	groups.sort((a, b) => {
		if (a.shop === null) return 1;
		if (b.shop === null) return -1;
		return a.shop.name.localeCompare(b.shop.name, "pl");
	});

	return groups;
}
