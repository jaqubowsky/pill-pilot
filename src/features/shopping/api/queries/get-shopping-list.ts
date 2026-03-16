import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	ProtocolStatus,
	protocols,
	shops,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";
import { toDateString } from "@/shared/lib/date";
import { DELIVERY_BUFFER_DAYS, forecastDaysInStock } from "@/shared/lib/stock-forecast";

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
	stockWarningThreshold: number;
	daysRemaining: number;
	depletionDate: string;
	isMustBuy: boolean;
};

export type ShoppingGroup = {
	shop: ShopInfo | null;
	items: ShoppingItem[];
};

type ScheduleRow = {
	supplementId: string;
	dosageAmount: string;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	protocolStartDate: string | null;
};

const SUGGEST_ADD_DAYS = 30;

function isOneTimeSupplement(schedules: ScheduleRow[]): boolean {
	if (schedules.length === 0) return false;
	return schedules.every((s) => s.durationDays !== null);
}

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
			hasActiveSchedules: sql<number>`COALESCE(SUM(
				CASE WHEN ${supplementSchedules.active} = true AND ${protocols.status} = ${ProtocolStatus.active}
				THEN 1
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

	const schedulesPerSupplement = new Map<string, ScheduleRow[]>();
	for (const row of scheduleRows) {
		const arr = schedulesPerSupplement.get(row.supplementId) ?? [];
		arr.push(row);
		schedulesPerSupplement.set(row.supplementId, arr);
	}

	const today = toDateString(new Date());
	const todayMs = new Date(today).getTime();
	const MS_PER_DAY = 86_400_000;

	const mustBuyItems: ShoppingItem[] = [];
	const suggestAddItems: ShoppingItem[] = [];
	const shopIdsNeeded = new Set<string>();

	for (const row of rows) {
		const schedules = schedulesPerSupplement.get(row.id) ?? [];

		if (isOneTimeSupplement(schedules)) continue;

		const stock = Number(row.currentStock);
		const threshold = row.stockWarningThreshold ?? 7;
		const effectiveThreshold = threshold + DELIVERY_BUFFER_DAYS;

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

		if (daysRemaining === Number.POSITIVE_INFINITY) continue;

		const depletionDate = toDateString(new Date(todayMs + daysRemaining * MS_PER_DAY));

		if (row.shopId) shopIdsNeeded.add(row.shopId);

		const item: ShoppingItem = {
			id: row.id,
			name: row.name,
			packagePrice: row.packagePrice,
			packageSize: row.packageSize,
			shopId: row.shopId,
			stockUnit: row.stockUnit,
			stockWarningThreshold: threshold,
			daysRemaining,
			depletionDate,
			isMustBuy: daysRemaining <= effectiveThreshold,
		};

		if (daysRemaining <= effectiveThreshold) {
			mustBuyItems.push(item);
		} else if (daysRemaining <= SUGGEST_ADD_DAYS) {
			suggestAddItems.push(item);
		}
	}

	const shopsData =
		shopIdsNeeded.size > 0
			? await db
					.select({
						id: shops.id,
						name: shops.name,
						deliveryCost: shops.deliveryCost,
						freeDeliveryThreshold: shops.freeDeliveryThreshold,
					})
					.from(shops)
					.where(inArray(shops.id, [...shopIdsNeeded]))
			: [];

	const shopMap = new Map<string, ShopInfo>(shopsData.map((s) => [s.id, s]));

	const allItems = [...mustBuyItems, ...suggestAddItems];
	allItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

	const groupMap = new Map<string | null, ShoppingItem[]>();

	for (const item of allItems) {
		const key = item.shopId ?? null;
		const arr = groupMap.get(key) ?? [];
		arr.push(item);
		groupMap.set(key, arr);
	}

	const groups: ShoppingGroup[] = [];

	for (const [shopId, items] of groupMap.entries()) {
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
