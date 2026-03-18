import type { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import type { ScheduleConsumption } from "@/shared/lib/stock-forecast";
import { forecastDaysInStock } from "@/shared/lib/stock-forecast";

export type StockListItem = {
	id: string;
	name: string;
	brandName: string | null;
	shopId: string | null;
	category: SupplementCategory;
	stockUnit: DosageUnit;
	isCritical: boolean;
	currentStock: string | null;
	packageSize: number | null;
	packagePrice: string | null;
	dailyUsage: number;
	daysInStock: number;
};

export type StockList = {
	tracked: StockListItem[];
	untracked: StockListItem[];
};

type RawSupplementRow = {
	id: string;
	name: string;
	brandName: string | null;
	shopId: string | null;
	category: SupplementCategory;
	stockUnit: DosageUnit;
	isCritical: boolean;
	currentStock: string | null;
	packageSize: number | null;
	packagePrice: string | null;
	dailyUsage: number;
};

type RawScheduleRow = ScheduleConsumption & {
	supplementId: string;
};

function groupSchedulesBySupplement(
	scheduleRows: RawScheduleRow[],
): Map<string, ScheduleConsumption[]> {
	const map = new Map<string, ScheduleConsumption[]>();
	for (const { supplementId, ...schedule } of scheduleRows) {
		const list = map.get(supplementId) ?? [];
		list.push(schedule);
		map.set(supplementId, list);
	}
	return map;
}

function sortTracked(items: StockListItem[]): StockListItem[] {
	return items.sort((a, b) => {
		if (a.daysInStock !== b.daysInStock) return a.daysInStock - b.daysInStock;
		const pctA = a.packageSize ? parseFloat(a.currentStock ?? "0") / a.packageSize : 1;
		const pctB = b.packageSize ? parseFloat(b.currentStock ?? "0") / b.packageSize : 1;
		return pctA - pctB;
	});
}

export function buildStockList(
	rows: RawSupplementRow[],
	scheduleRows: RawScheduleRow[],
	today: string,
): StockList {
	const schedulesPerSupplement = groupSchedulesBySupplement(scheduleRows);

	const tracked: StockListItem[] = [];
	const untracked: StockListItem[] = [];

	for (const row of rows) {
		let daysInStock = 0;
		if (row.currentStock !== null) {
			const schedules = schedulesPerSupplement.get(row.id) ?? [];
			daysInStock = forecastDaysInStock(parseFloat(row.currentStock), schedules, today);
		}

		const item: StockListItem = {
			...row,
			dailyUsage: Number(row.dailyUsage),
			daysInStock,
		};

		if (item.currentStock !== null) {
			tracked.push(item);
		} else {
			untracked.push(item);
		}
	}

	return { tracked: sortTracked(tracked), untracked };
}
