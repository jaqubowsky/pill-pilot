import webPush from "web-push";

let initialized = false;

function ensureInitialized() {
	if (initialized) return;
	webPush.setVapidDetails(
		`mailto:${process.env.VAPID_EMAIL!}`,
		process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
		process.env.VAPID_PRIVATE_KEY!,
	);
	initialized = true;
}

export function sendPushNotification(
	subscriptionJson: string,
	payload: { title: string; body: string },
) {
	ensureInitialized();
	const subscription = JSON.parse(subscriptionJson) as webPush.PushSubscription;
	return webPush.sendNotification(subscription, JSON.stringify(payload));
}

export { webPush };
