import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { ProtocolStatus, protocols, supplementSchedules, supplements } from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";
import { forecastDaysInStock } from "@/shared/lib/stock-forecast";

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
				CASE WHEN ${supplementSchedules.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
				THEN CAST(${supplementSchedules.dosageAmount} AS numeric)
				ELSE 0 END
			), 0)`,
		})
		.from(supplements)
		.leftJoin(supplementSchedules, eq(supplementSchedules.supplementId, supplements.id))
		.leftJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
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
				CASE WHEN ${supplementSchedules.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
				THEN CAST(${supplementSchedules.dosageAmount} AS numeric)
				ELSE 0 END
			), 0) > 0`,
		);

	const supplementIds = rows.map((r) => r.id);

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
	const items: LowStockItem[] = [];

	for (const row of rows) {
		const dailyUsage = Number(row.dailyUsage);
		const stock = Number(row.currentStock);
		const threshold = row.stockWarningThreshold ?? 7;

		const schedules = schedulesPerSupplement.get(row.id) ?? [];
		const daysRemaining = forecastDaysInStock(
			stock,
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
