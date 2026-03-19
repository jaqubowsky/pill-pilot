import { vi } from "vitest";

export class ActionError extends Error {
	constructor(public code: string) {
		super(code);
	}
}

export const ActionErrorCode = {
	UNAUTHORIZED: "UNAUTHORIZED",
	SUPPLEMENT_NOT_FOUND: "SUPPLEMENT_NOT_FOUND",
	SCHEDULE_NOT_FOUND: "SCHEDULE_NOT_FOUND",
	PROTOCOL_NOT_FOUND: "PROTOCOL_NOT_FOUND",
	TIME_BLOCK_NOT_FOUND: "TIME_BLOCK_NOT_FOUND",
	HAS_ACTIVE_SCHEDULES: "HAS_ACTIVE_SCHEDULES",
	OUT_OF_STOCK: "OUT_OF_STOCK",
	COOLDOWN_ACTIVE: "COOLDOWN_ACTIVE",
	SHOP_NOT_FOUND: "SHOP_NOT_FOUND",
} as const;

export const authActionClient = {
	inputSchema: (schema: any) => ({
		action: (handler: any) => async (input: any) => {
			const parsed = schema.parse(input);
			return handler({ parsedInput: parsed, ctx: { userId: "user-1" } });
		},
	}),
};

export const revalidatePath = vi.fn();
