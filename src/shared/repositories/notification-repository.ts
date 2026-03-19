import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { notificationSettings, pushSubscriptions } from "@/shared/db/schema";

type PushSubscription = typeof pushSubscriptions.$inferSelect;
type NotificationSetting = typeof notificationSettings.$inferSelect;

interface INotificationRepository {
	findByUserId(userId: string): Promise<PushSubscription[]>;
	findSettingsByUserId(userId: string): Promise<NotificationSetting[]>;
	upsertSubscription(userId: string, subscriptionJson: string): Promise<PushSubscription>;
	deleteSubscription(userId: string, subscriptionJson: string): Promise<void>;
	upsertSettings(
		userId: string,
		settings: { timeBlockId: string; enabled: boolean; notifyAt: string }[],
	): Promise<void>;
	findSettingsForTimeBlock(
		timeBlockId: string,
	): Promise<(NotificationSetting & { subscriptions: PushSubscription[] })[]>;
	syncNotifyAtForTimeBlock(timeBlockId: string, userId: string, notifyAt: string): Promise<void>;
}

class NotificationRepository implements INotificationRepository {
	async findByUserId(userId: string): Promise<PushSubscription[]> {
		return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
	}

	async findSettingsByUserId(userId: string): Promise<NotificationSetting[]> {
		return db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
	}

	async upsertSubscription(userId: string, subscriptionJson: string): Promise<PushSubscription> {
		const existing = await db
			.select()
			.from(pushSubscriptions)
			.where(
				and(
					eq(pushSubscriptions.userId, userId),
					eq(pushSubscriptions.subscriptionJson, subscriptionJson),
				),
			);

		if (existing[0]) {
			return existing[0];
		}

		const rows = await db
			.insert(pushSubscriptions)
			.values({ userId, subscriptionJson })
			.returning();
		return rows[0];
	}

	async deleteSubscription(userId: string, subscriptionJson: string): Promise<void> {
		await db
			.delete(pushSubscriptions)
			.where(
				and(
					eq(pushSubscriptions.userId, userId),
					eq(pushSubscriptions.subscriptionJson, subscriptionJson),
				),
			);
	}

	async upsertSettings(
		userId: string,
		settings: { timeBlockId: string; enabled: boolean; notifyAt: string }[],
	): Promise<void> {
		for (const setting of settings) {
			const existing = await db
				.select()
				.from(notificationSettings)
				.where(
					and(
						eq(notificationSettings.userId, userId),
						eq(notificationSettings.timeBlockId, setting.timeBlockId),
					),
				);

			if (existing[0]) {
				const timeChanged = existing[0].notifyAt !== setting.notifyAt;
				await db
					.update(notificationSettings)
					.set({
						enabled: setting.enabled,
						notifyAt: setting.notifyAt,
						...(timeChanged && { lastSentDate: null }),
					})
					.where(eq(notificationSettings.id, existing[0].id));
			} else {
				await db.insert(notificationSettings).values({
					userId,
					timeBlockId: setting.timeBlockId,
					enabled: setting.enabled,
					notifyAt: setting.notifyAt,
				});
			}
		}
	}

	async findSettingsForTimeBlock(
		timeBlockId: string,
	): Promise<(NotificationSetting & { subscriptions: PushSubscription[] })[]> {
		const settings = await db
			.select()
			.from(notificationSettings)
			.where(
				and(
					eq(notificationSettings.timeBlockId, timeBlockId),
					eq(notificationSettings.enabled, true),
				),
			);

		if (settings.length === 0) return [];

		const userIds = [...new Set(settings.map((s) => s.userId))];
		const allSubscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(inArray(pushSubscriptions.userId, userIds));

		const subscriptionsByUser = new Map<string, PushSubscription[]>();
		for (const sub of allSubscriptions) {
			const list = subscriptionsByUser.get(sub.userId) ?? [];
			list.push(sub);
			subscriptionsByUser.set(sub.userId, list);
		}

		return settings.map((setting) => ({
			...setting,
			subscriptions: subscriptionsByUser.get(setting.userId) ?? [],
		}));
	}

	async syncNotifyAtForTimeBlock(
		timeBlockId: string,
		userId: string,
		notifyAt: string,
	): Promise<void> {
		await db
			.update(notificationSettings)
			.set({ notifyAt, lastSentDate: null })
			.where(
				and(
					eq(notificationSettings.timeBlockId, timeBlockId),
					eq(notificationSettings.userId, userId),
				),
			);
	}
}

export const notificationRepository: INotificationRepository = new NotificationRepository();
