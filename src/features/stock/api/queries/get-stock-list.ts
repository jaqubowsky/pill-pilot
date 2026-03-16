import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { ProtocolStatus, protocols, supplementSchedules, supplements } from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";
import { forecastDaysInStock } from "@/shared/lib/stock-forecast";

export type StockListItem = {
	id: string;
	name: string;
	brandName: string | null;
	shopId: string | null;
	category: string;
	stockUnit: string;
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

export async function getStockList(userId: string): Promise<StockList> {
	const rows = await db
		.select({
			id: supplements.id,
			name: supplements.name,
			brandName: supplements.brandName,
			shopId: supplements.shopId,
			category: supplements.category,
			stockUnit: supplements.stockUnit,
			isCritical: sql<boolean>`COALESCE(BOOL_OR(
        CASE WHEN ${supplementSchedules.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
        THEN ${supplementSchedules.isCritical}
        ELSE false END
      ), false)`,
			currentStock: supplements.currentStock,
			packageSize: supplements.packageSize,
			packagePrice: supplements.packagePrice,
			dailyUsage: sql<number>`COALESCE(SUM(
        CASE WHEN ${supplementSchedules.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
        THEN CAST(${supplementSchedules.dosageAmount} AS numeric)
        ELSE 0 END
      ), 0)`,
		})
		.from(supplements)
		.leftJoin(supplementSchedules, eq(supplementSchedules.supplementId, supplements.id))
		.leftJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.where(and(eq(supplements.userId, userId), eq(supplements.active, true)))
		.groupBy(supplements.id);

	const supplementIds = rows.filter((r) => r.currentStock !== null).map((r) => r.id);

	const scheduleRows =
		supplementIds.length > 0
			? await db
					.select({
						supplementId: supplementSchedules.supplementId,
						dosageAmount: supplementSchedules.dosageAmount,
						cycleDaysOn: supplementSchedules.cycleDaysOn,
						cycleDaysOff: supplementSchedules.cycleDaysOff,
						startDayOffset: supplementSchedules.startDayOffset,
						durationDays: supplementSchedules.durationDays,
						protocolStartDate: protocols.startDate,
					})
					.from(supplementSchedules)
					.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
					.where(
						and(
							sql`${supplementSchedules.supplementId} IN ${supplementIds}`,
							eq(supplementSchedules.active, true),
							eq(protocols.status, ProtocolStatus.active),
						),
					)
			: [];

	const schedulesPerSupplement = new Map<string, typeof scheduleRows>();
	for (const row of scheduleRows) {
		const arr = schedulesPerSupplement.get(row.supplementId) ?? [];
		arr.push(row);
		schedulesPerSupplement.set(row.supplementId, arr);
	}

	const today = toDateString(new Date());
	const tracked: StockListItem[] = [];
	const untracked: StockListItem[] = [];

	for (const row of rows) {
		let daysInStock = 0;
		if (row.currentStock !== null) {
			const schedules = schedulesPerSupplement.get(row.id) ?? [];
			daysInStock = forecastDaysInStock(
				parseFloat(row.currentStock),
				schedules.map((s) => ({
					dosageAmount: parseFloat(s.dosageAmount),
					cycleDaysOn: s.cycleDaysOn,
					cycleDaysOff: s.cycleDaysOff,
					startDayOffset: s.startDayOffset,
					durationDays: s.durationDays,
					protocolStartDate: s.protocolStartDate,
				})),
				today,
			);
		}

		const item: StockListItem = {
			id: row.id,
			name: row.name,
			brandName: row.brandName,
			shopId: row.shopId,
			category: row.category,
			stockUnit: row.stockUnit,
			isCritical: row.isCritical,
			currentStock: row.currentStock,
			packageSize: row.packageSize,
			packagePrice: row.packagePrice,
			dailyUsage: Number(row.dailyUsage),
			daysInStock,
		};

		if (item.currentStock !== null) {
			tracked.push(item);
		} else {
			untracked.push(item);
		}
	}

	tracked.sort((a, b) => {
		if (a.daysInStock !== b.daysInStock) return a.daysInStock - b.daysInStock;
		const stockA = parseFloat(a.currentStock!);
		const stockB = parseFloat(b.currentStock!);
		const pctA = a.packageSize ? stockA / a.packageSize : 1;
		const pctB = b.packageSize ? stockB / b.packageSize : 1;
		return pctA - pctB;
	});

	return { tracked, untracked };
}
