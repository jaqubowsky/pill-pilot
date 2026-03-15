"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export function usePushSubscription() {
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isSupported, setIsSupported] = useState(true);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supported = "serviceWorker" in navigator && "PushManager" in window;
		setIsSupported(supported);

		if (!supported) {
			setLoading(false);
			return;
		}

		navigator.serviceWorker.ready
			.then((registration) => registration.pushManager.getSubscription())
			.then((subscription) => {
				setIsSubscribed(!!subscription);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	const subscribe = useCallback(async () => {
		if (!isSupported) return false;

		setLoading(true);
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
			});

			await fetch("/api/push/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subscription: subscription.toJSON(),
					action: "subscribe",
				}),
			});

			setIsSubscribed(true);
			return true;
		} catch {
			return false;
		} finally {
			setLoading(false);
		}
	}, [isSupported]);

	const unsubscribe = useCallback(async () => {
		if (!isSupported) return false;

		setLoading(true);
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				await fetch("/api/push/subscribe", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						subscription: subscription.toJSON(),
						action: "unsubscribe",
					}),
				});
				await subscription.unsubscribe();
			}

			setIsSubscribed(false);
			return true;
		} catch {
			return false;
		} finally {
			setLoading(false);
		}
	}, [isSupported]);

	return { isSubscribed, isSupported, subscribe, unsubscribe, loading };
}
