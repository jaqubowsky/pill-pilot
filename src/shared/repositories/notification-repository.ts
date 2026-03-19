import { and, eq } from "drizzle-orm";
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

		const results: (NotificationSetting & { subscriptions: PushSubscription[] })[] = [];

		for (const setting of settings) {
			const subscriptions = await db
				.select()
				.from(pushSubscriptions)
				.where(eq(pushSubscriptions.userId, setting.userId));

			results.push({ ...setting, subscriptions });
		}

		return results;
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
