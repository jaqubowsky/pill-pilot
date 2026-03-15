"use client";

import { useAction } from "next-safe-action/hooks";
import { useCallback, useOptimistic, useTransition } from "react";
import { updateNotificationSettings } from "@/features/notifications/api/actions/update-notification-settings";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";

type TimeBlockSetting = {
	timeBlockId: string;
	name: string;
	startTime: string;
	enabled: boolean;
	notifyAt: string;
};

type NotificationSettingInput = {
	timeBlockId: string;
	enabled: boolean;
	notifyAt: string;
};

export function useNotificationSection(
	timeBlocks: { id: string; name: string; startTime: string }[],
	initialSettings: NotificationSettingInput[],
) {
	const {
		isSubscribed,
		isSupported,
		subscribe,
		unsubscribe,
		loading: pushLoading,
	} = usePushSubscription();

	const settingsMap = new Map(initialSettings.map((s) => [s.timeBlockId, s]));

	const blockSettings: TimeBlockSetting[] = timeBlocks.map((tb) => {
		const setting = settingsMap.get(tb.id);
		return {
			timeBlockId: tb.id,
			name: tb.name,
			startTime: tb.startTime,
			enabled: setting?.enabled ?? false,
			notifyAt: setting?.notifyAt ?? tb.startTime,
		};
	});

	const [optimisticSettings, setOptimisticSettings] = useOptimistic(blockSettings);
	const [isPending, startTransition] = useTransition();

	const { execute } = useAction(updateNotificationSettings);

	const handleTogglePush = useCallback(async () => {
		if (isSubscribed) {
			await unsubscribe();
		} else {
			await subscribe();
		}
	}, [isSubscribed, subscribe, unsubscribe]);

	const handleToggleBlock = useCallback(
		(timeBlockId: string, enabled: boolean) => {
			startTransition(() => {
				const updated = optimisticSettings.map((s) =>
					s.timeBlockId === timeBlockId ? { ...s, enabled } : s,
				);
				setOptimisticSettings(updated);
				execute({
					settings: updated.map((s) => ({
						timeBlockId: s.timeBlockId,
						enabled: s.timeBlockId === timeBlockId ? enabled : s.enabled,
						notifyAt: s.notifyAt,
					})),
				});
			});
		},
		[optimisticSettings, setOptimisticSettings, execute],
	);

	const handleTimeChange = useCallback(
		(timeBlockId: string, notifyAt: string) => {
			startTransition(() => {
				const updated = optimisticSettings.map((s) =>
					s.timeBlockId === timeBlockId ? { ...s, notifyAt } : s,
				);
				setOptimisticSettings(updated);
				execute({
					settings: updated.map((s) => ({
						timeBlockId: s.timeBlockId,
						enabled: s.enabled,
						notifyAt: s.timeBlockId === timeBlockId ? notifyAt : s.notifyAt,
					})),
				});
			});
		},
		[optimisticSettings, setOptimisticSettings, execute],
	);

	return {
		isSubscribed,
		isSupported,
		pushLoading,
		isPending,
		blockSettings: optimisticSettings,
		handleTogglePush,
		handleToggleBlock,
		handleTimeChange,
	};
}
