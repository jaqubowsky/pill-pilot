import { getUserProtocols } from "./api/queries/get-user-protocols";
import { getUserTimeBlocks } from "./api/queries/get-user-time-blocks";
import { SettingsPage } from "./components/settings-page";

type SettingsPageWrapperProps = {
	userId: string;
	userEmail: string;
};

export async function SettingsPageWrapper({ userId, userEmail }: SettingsPageWrapperProps) {
	const [protocols, timeBlocks] = await Promise.all([
		getUserProtocols(userId),
		getUserTimeBlocks(userId),
	]);

	return <SettingsPage protocols={protocols} timeBlocks={timeBlocks} userEmail={userEmail} />;
}
