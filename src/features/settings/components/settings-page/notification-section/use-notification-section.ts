"use client";

import { useTranslations } from "next-intl";
import { useAction, useOptimisticAction } from "next-safe-action/hooks";
import { useCallback } from "react";
import { toast } from "sonner";
import { sendTestNotification } from "@/features/settings/api/actions/send-test-notification";
import { updateNotificationSettings } from "@/features/settings/api/actions/update-notification-settings";
import { usePushSubscription } from "./use-push-subscription";

type TimeBlockInput = {
	id: string;
	name: string;
	startTime: string;
};

type NotificationSettingInput = {
	timeBlockId: string;
	enabled: boolean;
	notifyAt: string;
};

type TimeBlockSetting = {
	timeBlockId: string;
	name: string;
	startTime: string;
	enabled: boolean;
	notifyAt: string;
};

function buildBlockSettings(
	timeBlocks: TimeBlockInput[],
	initialSettings: NotificationSettingInput[],
): TimeBlockSetting[] {
	const settingsMap = new Map(initialSettings.map((s) => [s.timeBlockId, s]));

	return timeBlocks.map((tb) => {
		const setting = settingsMap.get(tb.id);
		return {
			timeBlockId: tb.id,
			name: tb.name,
			startTime: tb.startTime,
			enabled: setting?.enabled ?? false,
			notifyAt: setting?.notifyAt ?? tb.startTime,
		};
	});
}

export function useNotificationSection(
	timeBlocks: TimeBlockInput[],
	initialSettings: NotificationSettingInput[],
) {
	const t = useTranslations("settings.notifications");

	const {
		isSubscribed,
		isSupported,
		subscribe,
		unsubscribe,
		loading: pushLoading,
	} = usePushSubscription();

	const blockSettings = buildBlockSettings(timeBlocks, initialSettings);

	const { execute, optimisticState, isPending } = useOptimisticAction(updateNotificationSettings, {
		currentState: blockSettings,
		updateFn: (state, { settings }: { settings: NotificationSettingInput[] }) =>
			state.map((s) => {
				const updated = settings.find((u) => u.timeBlockId === s.timeBlockId);
				return updated ? { ...s, enabled: updated.enabled, notifyAt: updated.notifyAt } : s;
			}),
	});

	const { execute: executeTest, isPending: isTestPending } = useAction(sendTestNotification, {
		onSuccess: () => toast.success(t("testSuccess")),
		onError: () => toast.error(t("testError")),
	});

	const handleTogglePush = useCallback(async () => {
		if (isSubscribed) {
			await unsubscribe();
			return;
		}

		const success = await subscribe();
		if (!success) return;

		const hasExistingSettings = initialSettings.some((s) => s.enabled);
		if (hasExistingSettings) return;

		execute({
			settings: blockSettings.map((s) => ({
				timeBlockId: s.timeBlockId,
				enabled: true,
				notifyAt: s.notifyAt,
			})),
		});
	}, [isSubscribed, subscribe, unsubscribe, initialSettings, blockSettings, execute]);

	const handleToggleBlock = useCallback(
		(timeBlockId: string, enabled: boolean) => {
			execute({
				settings: optimisticState.map((s) => ({
					timeBlockId: s.timeBlockId,
					enabled: s.timeBlockId === timeBlockId ? enabled : s.enabled,
					notifyAt: s.notifyAt,
				})),
			});
		},
		[optimisticState, execute],
	);

	const handleTimeChange = useCallback(
		(timeBlockId: string, notifyAt: string) => {
			execute({
				settings: optimisticState.map((s) => ({
					timeBlockId: s.timeBlockId,
					enabled: s.enabled,
					notifyAt: s.timeBlockId === timeBlockId ? notifyAt : s.notifyAt,
				})),
			});
		},
		[optimisticState, execute],
	);

	const handleTestNotification = useCallback(() => {
		executeTest({});
	}, [executeTest]);

	return {
		isSubscribed,
		isSupported,
		pushLoading,
		isPending,
		isTestPending,
		blockSettings: optimisticState,
		handleTogglePush,
		handleToggleBlock,
		handleTimeChange,
		handleTestNotification,
	};
}
