import { NextResponse } from "next/server";
import { sendTimerNotifications } from "@/features/settings/api/services/push-timers-service";

export async function POST(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await sendTimerNotifications();
	return NextResponse.json(result);
}
