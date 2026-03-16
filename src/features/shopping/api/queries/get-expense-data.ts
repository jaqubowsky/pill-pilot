import { and, eq, gte } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
	dailyLogs,
	ProtocolStatus,
	protocols,
	supplementSchedules,
	supplements,
} from "@/shared/db/schema";

export type WeekExpense = {
	weekNum: number;
	cost: number;
};

export type MonthExpense = {
	month: string;
	total: number;
};

export type ExpenseData = {
	currentMonth: {
		weeks: WeekExpense[];
		total: number;
	};
	previousMonths: MonthExpense[];
	supplementsMissingPrices: number;
};

function getWeekOfMonth(date: Date): number {
	const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
	const dayOfMonth = date.getDate();
	const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
	return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

function getMonthKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getExpenseData(userId: string): Promise<ExpenseData> {
	const now = new Date();
	const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

	const startDateStr = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

	const rows = await db
		.select({
			logDate: dailyLogs.date,
			dosageAmount: supplementSchedules.dosageAmount,
			packagePrice: supplements.packagePrice,
			packageSize: supplements.packageSize,
			supplementId: supplements.id,
		})
		.from(dailyLogs)
		.innerJoin(supplementSchedules, eq(dailyLogs.scheduleId, supplementSchedules.id))
		.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.where(
			and(
				eq(supplements.userId, userId),
				eq(protocols.status, ProtocolStatus.active),
				gte(dailyLogs.date, startDateStr),
			),
		);

	const currentMonthKey = getMonthKey(now);

	const weekCosts = new Map<number, number>();
	const monthCosts = new Map<string, number>();
	let supplementsMissingPrices = 0;
	const seenMissingSupplements = new Set<string>();

	for (const row of rows) {
		const hasPricing = row.packagePrice !== null && row.packageSize !== null && row.packageSize > 0;

		if (!hasPricing) {
			if (!seenMissingSupplements.has(row.supplementId)) {
				seenMissingSupplements.add(row.supplementId);
				supplementsMissingPrices++;
			}
			continue;
		}

		const unitCost = Number(row.packagePrice) / row.packageSize!;
		const cost = unitCost * Number(row.dosageAmount);

		const logDate = new Date(row.logDate);
		const monthKey = getMonthKey(logDate);

		if (monthKey === currentMonthKey) {
			const weekNum = getWeekOfMonth(logDate);
			weekCosts.set(weekNum, (weekCosts.get(weekNum) ?? 0) + cost);
		} else {
			monthCosts.set(monthKey, (monthCosts.get(monthKey) ?? 0) + cost);
		}
	}

	const weeks: WeekExpense[] = Array.from(weekCosts.entries())
		.map(([weekNum, cost]) => ({ weekNum, cost }))
		.sort((a, b) => a.weekNum - b.weekNum);

	const currentMonthTotal = weeks.reduce((sum, w) => sum + w.cost, 0);

	const previousMonths: MonthExpense[] = [];
	const prevMonthKeys = [
		getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
		getMonthKey(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
	];

	for (const monthKey of prevMonthKeys) {
		const total = monthCosts.get(monthKey) ?? 0;
		previousMonths.push({ month: monthKey, total });
	}

	return {
		currentMonth: {
			weeks,
			total: currentMonthTotal,
		},
		previousMonths,
		supplementsMissingPrices,
	};
}
