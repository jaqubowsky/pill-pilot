import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	ProtocolStatus,
	protocolSupplements,
	protocols,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";

export type LowStockItem = {
	id: string;
	name: string;
	brandName: string | null;
	currentStock: string;
	dailyUsage: number;
	daysRemaining: number;
	stockUnit: string;
	stockWarningThreshold: number;
};

export async function getLowStock(userId: string): Promise<LowStockItem[]> {
	const rows = await db
		.select({
			id: supplements.id,
			name: supplements.name,
			brandName: supplements.brandName,
			currentStock: supplements.currentStock,
			stockUnit: supplements.stockUnit,
			stockWarningThreshold: supplements.stockWarningThreshold,
			dailyUsage: sql<number>`COALESCE(SUM(
				CASE WHEN ${protocolSupplements.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
				THEN CAST(${supplementSchedules.dosageAmount} AS numeric)
				ELSE 0 END
			), 0)`,
		})
		.from(supplements)
		.leftJoin(protocolSupplements, eq(protocolSupplements.supplementId, supplements.id))
		.leftJoin(
			supplementSchedules,
			eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
		)
		.leftJoin(protocols, eq(protocolSupplements.protocolId, protocols.id))
		.where(
			and(
				eq(supplements.userId, userId),
				eq(supplements.active, true),
				sql`${supplements.currentStock} IS NOT NULL`,
			),
		)
		.groupBy(supplements.id)
		.having(
			sql`COALESCE(SUM(
				CASE WHEN ${protocolSupplements.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
				THEN CAST(${supplementSchedules.dosageAmount} AS numeric)
				ELSE 0 END
			), 0) > 0`,
		);

	const items: LowStockItem[] = [];

	for (const row of rows) {
		const dailyUsage = Number(row.dailyUsage);
		const stock = Number(row.currentStock);
		const threshold = row.stockWarningThreshold ?? 7;
		const daysRemaining =
			dailyUsage > 0 ? Math.floor(stock / dailyUsage) : Number.POSITIVE_INFINITY;

		if (daysRemaining <= threshold) {
			items.push({
				id: row.id,
				name: row.name,
				brandName: row.brandName,
				currentStock: row.currentStock!,
				dailyUsage,
				daysRemaining,
				stockUnit: row.stockUnit,
				stockWarningThreshold: threshold,
			});
		}
	}

	items.sort((a, b) => a.daysRemaining - b.daysRemaining);

	return items;
}
