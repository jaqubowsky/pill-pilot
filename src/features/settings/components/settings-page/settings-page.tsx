"use client";

import { useTranslations } from "next-intl";
import type { NotificationSettingData } from "@/features/settings/api/queries/get-notification-settings";
import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { AccountSection } from "./account-section";
import { NotificationSection } from "./notification-section";
import { ProtocolSection } from "./protocol-section";
import { SectionHeader } from "./section-header";
import { TimeBlocksSection } from "./time-blocks-section";

type SettingsPageProps = {
	protocols: ProtocolWithSchedules[];
	timeBlocks: UserTimeBlock[];
	notificationSettings: NotificationSettingData[];
};

function mapTimeBlocksForNotifications(timeBlocks: UserTimeBlock[]) {
	return timeBlocks.map((tb) => ({
		id: tb.id,
		name: tb.name,
		startTime: tb.startTime,
	}));
}

export function SettingsPage({ protocols, timeBlocks, notificationSettings }: SettingsPageProps) {
	const t = useTranslations("settings");

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<h1 className="font-display text-2xl text-content">{t("title")}</h1>

			<div>
				<SectionHeader label={t("protocols")} />
				<ProtocolSection protocols={protocols} />
			</div>

			<div>
				<SectionHeader label={t("timeBlocks")} />
				<TimeBlocksSection timeBlocks={timeBlocks} notificationSettings={notificationSettings} />
			</div>

			<div>
				<SectionHeader label={t("notificationsLabel")} />
				<NotificationSection
					timeBlocks={mapTimeBlocksForNotifications(timeBlocks)}
					initialSettings={notificationSettings}
				/>
			</div>

			<div>
				<SectionHeader label={t("account")} />
				<AccountSection />
			</div>
		</div>
	);
}
