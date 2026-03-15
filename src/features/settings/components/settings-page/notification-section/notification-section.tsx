"use client";

import { useTranslations } from "next-intl";
import { ToggleRow } from "@/shared/components/toggle-row";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { useNotificationSection } from "./use-notification-section";

type NotificationSectionProps = {
	timeBlocks: { id: string; name: string; startTime: string }[];
	initialSettings: { timeBlockId: string; enabled: boolean; notifyAt: string }[];
};

export function NotificationSection({ timeBlocks, initialSettings }: NotificationSectionProps) {
	const t = useTranslations("settings.notifications");

	const {
		isSubscribed,
		isSupported,
		pushLoading,
		blockSettings,
		handleTogglePush,
		handleToggleBlock,
		handleTimeChange,
	} = useNotificationSection(timeBlocks, initialSettings);

	if (!isSupported) {
		return null;
	}

	return (
		<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md flex flex-col gap-sm">
			<ToggleRow
				label={t("enable")}
				checked={isSubscribed}
				onCheckedChange={handleTogglePush}
				disabled={pushLoading}
			/>

			{isSubscribed && (
				<div className="flex flex-col gap-xs">
					{blockSettings.map((setting) => (
						<div
							key={setting.timeBlockId}
							className="flex items-center justify-between gap-sm min-h-11"
						>
							<div className="flex items-center gap-sm flex-1 min-w-0">
								<Switch
									checked={setting.enabled}
									onCheckedChange={(checked) => handleToggleBlock(setting.timeBlockId, checked)}
								/>
								<span className="text-sm text-content-muted truncate">{setting.name}</span>
							</div>
							<Input
								type="time"
								value={setting.notifyAt}
								onChange={(e) => handleTimeChange(setting.timeBlockId, e.target.value)}
								disabled={!setting.enabled}
								className="w-24 text-center"
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
