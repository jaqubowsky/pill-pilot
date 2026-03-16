import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { ProtocolStatus, protocols, supplementSchedules, supplements } from "@/shared/db/schema";

export type StockListItem = {
	id: string;
	name: string;
	brandName: string | null;
	category: string;
	stockUnit: string;
	isCritical: boolean;
	currentStock: string | null;
	packageSize: number | null;
	packagePrice: string | null;
	dailyUsage: number;
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

	const tracked: StockListItem[] = [];
	const untracked: StockListItem[] = [];

	for (const row of rows) {
		const item: StockListItem = {
			id: row.id,
			name: row.name,
			brandName: row.brandName,
			category: row.category,
			stockUnit: row.stockUnit,
			isCritical: row.isCritical,
			currentStock: row.currentStock,
			packageSize: row.packageSize,
			packagePrice: row.packagePrice,
			dailyUsage: Number(row.dailyUsage),
		};

		if (item.currentStock !== null) {
			tracked.push(item);
		} else {
			untracked.push(item);
		}
	}

	tracked.sort((a, b) => {
		const stockA = parseFloat(a.currentStock!);
		const stockB = parseFloat(b.currentStock!);
		const daysA = a.dailyUsage > 0 ? stockA / a.dailyUsage : Infinity;
		const daysB = b.dailyUsage > 0 ? stockB / b.dailyUsage : Infinity;
		if (daysA !== daysB) return daysA - daysB;
		const pctA = a.packageSize ? stockA / a.packageSize : 1;
		const pctB = b.packageSize ? stockB / b.packageSize : 1;
		return pctA - pctB;
	});

	return { tracked, untracked };
}
