import { notificationRepository } from "@/shared/repositories/notification-repository";

export type NotificationSettingData = {
	timeBlockId: string;
	enabled: boolean;
	notifyAt: string;
};

export async function getNotificationSettings(userId: string): Promise<NotificationSettingData[]> {
	const settings = await notificationRepository.findSettingsByUserId(userId);
	return settings.map((s) => ({
		timeBlockId: s.timeBlockId,
		enabled: s.enabled,
		notifyAt: s.notifyAt,
	}));
}
