import { and, eq, inArray, sql } from "drizzle-orm";
import {
	buildStockList,
	type StockList,
	type StockListItem,
} from "@/features/stock/lib/build-stock-list";
import { db } from "@/shared/db/client";
import { ProtocolStatus, protocols, supplementSchedules, supplements } from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";

export type { StockList, StockListItem };

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
							inArray(supplementSchedules.supplementId, supplementIds),
							eq(supplementSchedules.active, true),
							eq(protocols.status, ProtocolStatus.active),
						),
					)
			: [];

	return buildStockList(
		rows,
		scheduleRows.map((s) => ({
			supplementId: s.supplementId,
			dosageAmount: parseFloat(s.dosageAmount),
			cycleDaysOn: s.cycleDaysOn,
			cycleDaysOff: s.cycleDaysOff,
			startDayOffset: s.startDayOffset,
			durationDays: s.durationDays,
			protocolStartDate: s.protocolStartDate,
		})),
		toDateString(new Date()),
	);
}
