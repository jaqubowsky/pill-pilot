import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import {
	buildShoppingList,
	type ShopInfo,
	type ShoppingGroup,
	type ShoppingItem,
} from "@/features/shopping/lib/build-shopping-list";
import { db } from "@/shared/db/client";
import {
	ProtocolStatus,
	protocols,
	shops,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";

export type { ShopInfo, ShoppingGroup, ShoppingItem };

export async function getShoppingList(userId: string): Promise<ShoppingGroup[]> {
	const rows = await db
		.select({
			id: supplements.id,
			name: supplements.name,
			currentStock: supplements.currentStock,
			stockUnit: supplements.stockUnit,
			stockWarningThreshold: supplements.stockWarningThreshold,
			packagePrice: supplements.packagePrice,
			packageSize: supplements.packageSize,
			shopId: supplements.shopId,
		})
		.from(supplements)
		.leftJoin(supplementSchedules, eq(supplementSchedules.supplementId, supplements.id))
		.leftJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.where(
			and(
				eq(supplements.userId, userId),
				eq(supplements.active, true),
				isNotNull(supplements.currentStock),
			),
		)
		.groupBy(supplements.id)
		.having(
			sql`COALESCE(SUM(
				CASE WHEN ${supplementSchedules.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
				THEN 1
				ELSE 0 END
			), 0) > 0`,
		);

	if (rows.length === 0) return [];

	const supplementIds = rows.map((r) => r.id);

	const scheduleRows = await db
		.select({
			supplementId: supplementSchedules.supplementId,
			dosageAmount: supplementSchedules.dosageAmount,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			protocolStartDate: protocols.startDate,
			finishPackage: supplementSchedules.finishPackage,
		})
		.from(supplementSchedules)
		.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.where(
			and(
				inArray(supplementSchedules.supplementId, supplementIds),
				eq(supplementSchedules.active, true),
				eq(protocols.status, ProtocolStatus.active),
			),
		);

	const shopIds = [...new Set(rows.map((r) => r.shopId).filter((id): id is string => id !== null))];
	const shopsData =
		shopIds.length > 0
			? await db
					.select({
						id: shops.id,
						name: shops.name,
						deliveryCost: shops.deliveryCost,
						freeDeliveryThreshold: shops.freeDeliveryThreshold,
					})
					.from(shops)
					.where(inArray(shops.id, shopIds))
			: [];

	const shopMap = new Map<string, ShopInfo>(shopsData.map((s) => [s.id, s]));

	return buildShoppingList(
		rows,
		scheduleRows.map((s) => ({
			...s,
			dosageAmount: parseFloat(s.dosageAmount),
		})),
		shopMap,
		toDateString(new Date()),
	);
}
