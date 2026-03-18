import { getNotificationSettings } from "./api/queries/get-notification-settings";
import { getUserProtocols } from "./api/queries/get-user-protocols";
import { getUserTimeBlocks } from "./api/queries/get-user-time-blocks";
import { SettingsPage } from "./components/settings-page";

type SettingsPageWrapperProps = {
	userId: string;
};

export async function SettingsPageWrapper({ userId }: SettingsPageWrapperProps) {
	const [protocols, timeBlocks, notificationSettings] = await Promise.all([
		getUserProtocols(userId),
		getUserTimeBlocks(userId),
		getNotificationSettings(userId),
	]);

	return (
		<SettingsPage
			protocols={protocols}
			timeBlocks={timeBlocks}
			notificationSettings={notificationSettings}
		/>
	);
}
