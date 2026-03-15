import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";
import { notificationRepository } from "@/shared/repositories/notification-repository";

export async function POST(request: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const { subscription, action } = body as {
		subscription: PushSubscriptionJSON;
		action: "subscribe" | "unsubscribe";
	};

	if (!subscription) {
		return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
	}

	const subscriptionJson = JSON.stringify(subscription);

	if (action === "unsubscribe") {
		await notificationRepository.deleteSubscription(session.user.id, subscriptionJson);
		return NextResponse.json({ success: true });
	}

	await notificationRepository.upsertSubscription(session.user.id, subscriptionJson);
	return NextResponse.json({ success: true });
}
