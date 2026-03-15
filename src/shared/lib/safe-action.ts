import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/shared/lib/auth";

export const ActionErrorCode = {
	UNAUTHORIZED: "UNAUTHORIZED",
	SUPPLEMENT_NOT_FOUND: "SUPPLEMENT_NOT_FOUND",
	SCHEDULE_NOT_FOUND: "SCHEDULE_NOT_FOUND",
	PROTOCOL_NOT_FOUND: "PROTOCOL_NOT_FOUND",
	TIME_BLOCK_NOT_FOUND: "TIME_BLOCK_NOT_FOUND",
	HAS_ACTIVE_SCHEDULES: "HAS_ACTIVE_SCHEDULES",
	OUT_OF_STOCK: "OUT_OF_STOCK",
	COOLDOWN_ACTIVE: "COOLDOWN_ACTIVE",
} as const;

export type ActionErrorCode = (typeof ActionErrorCode)[keyof typeof ActionErrorCode];

export class ActionError extends Error {
	constructor(public code: ActionErrorCode) {
		super(code);
	}
}

async function handleServerError(e: Error) {
	const t = await getTranslations("errors");

	if (e instanceof ActionError) {
		return t.has(e.code) ? t(e.code) : t("generic");
	}

	console.error("Action error:", e.message);
	return t("generic");
}

export const actionClient = createSafeActionClient({ handleServerError });

export const authActionClient = createSafeActionClient({ handleServerError }).use(
	async ({ next }) => {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			throw new ActionError(ActionErrorCode.UNAUTHORIZED);
		}

		return next({ ctx: { userId: session.user.id, user: session.user } });
	},
);
