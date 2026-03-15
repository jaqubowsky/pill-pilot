"use client";

import { useTranslations } from "next-intl";
import type { ProtocolWithSchedules } from "@/features/settings/api/queries/get-user-protocols";
import type { UserTimeBlock } from "@/features/settings/api/queries/get-user-time-blocks";
import { AccountSection } from "./account-section";
import { NotificationSection } from "./notification-section";
import { ProtocolSection } from "./protocol-section";
import { TimeBlocksSection } from "./time-blocks-section";

type NotificationSettingData = {
	timeBlockId: string;
	enabled: boolean;
	notifyAt: string;
};

type SettingsPageProps = {
	protocols: ProtocolWithSchedules[];
	timeBlocks: UserTimeBlock[];
	userEmail: string;
	notificationSettings: NotificationSettingData[];
};

function SectionHeader({ label }: { label: string }) {
	return (
		<p className="text-xs uppercase tracking-wide text-content-faint font-semibold mb-sm">
			{label}
		</p>
	);
}

export function SettingsPage({
	protocols,
	timeBlocks,
	userEmail,
	notificationSettings,
}: SettingsPageProps) {
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
					timeBlocks={timeBlocks.map((tb) => ({
						id: tb.id,
						name: tb.name,
						startTime: tb.startTime,
					}))}
					initialSettings={notificationSettings}
				/>
			</div>

			<div>
				<SectionHeader label={t("account")} />
				<AccountSection email={userEmail} />
			</div>
		</div>
	);
}
