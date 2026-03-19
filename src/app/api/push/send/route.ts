import { NextResponse } from "next/server";
import { sendScheduledNotifications } from "@/features/settings/api/services/push-send-service";

export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await sendScheduledNotifications();
	return NextResponse.json(result);
}
